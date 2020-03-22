import JsonRpcEngine from 'json-rpc-engine'
import asMiddleware from 'json-rpc-engine/src/asMiddleware'
import ObservableStore from 'obs-store'
import log from 'loglevel'
import { CapabilitiesController as RpcCap } from 'rpc-cap'
import { ethErrors } from 'eth-json-rpc-errors'
import { cloneDeep } from 'lodash'

import createMethodMiddleware from './methodMiddleware'
import PermissionsLogController from './permissionsLog'

// Methods that do not require any permissions to use:
import {
  SAFE_METHODS, // methods that do not require any permissions to use
  WALLET_PREFIX,
  METADATA_STORE_KEY,
  LOG_STORE_KEY,
  HISTORY_STORE_KEY,
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
} from './enums'

export class PermissionsController {

  constructor (
    {
      platform, notifyDomain, notifyAllDomains,
      getKeyringAccounts, getRestrictedMethods,
    } = {},
    restoredPermissions = {},
    restoredState = {}) {

    this.store = new ObservableStore({
      [METADATA_STORE_KEY]: restoredState[METADATA_STORE_KEY] || {},
      [LOG_STORE_KEY]: restoredState[LOG_STORE_KEY] || [],
      [HISTORY_STORE_KEY]: restoredState[HISTORY_STORE_KEY] || {},
    })

    this._notifyDomain = notifyDomain
    this.notifyAllDomains = notifyAllDomains
    this.getKeyringAccounts = getKeyringAccounts
    this._platform = platform
    this._restrictedMethods = getRestrictedMethods(this)
    this.permissionsLog = new PermissionsLogController({
      restrictedMethods: Object.keys(this._restrictedMethods),
      store: this.store,
    })
    this.pendingApprovals = new Map()
    this.pendingApprovalOrigins = new Set()
    this._initializePermissions(restoredPermissions)
  }

  createMiddleware ({ origin, extensionId }) {

    if (typeof origin !== 'string' || !origin.length) {
      throw new Error('Must provide non-empty string origin.')
    }

    if (extensionId) {
      this.store.updateState({
        [METADATA_STORE_KEY]: {
          ...this.store.getState()[METADATA_STORE_KEY],
          [origin]: { extensionId },
        },
      })
    }

    const engine = new JsonRpcEngine()

    engine.push(this.permissionsLog.createMiddleware())

    engine.push(createMethodMiddleware({
      store: this.store,
      storeKey: METADATA_STORE_KEY,
      getAccounts: this.getAccounts.bind(this, origin),
      requestAccountsPermission: this._requestPermissions.bind(
        this, origin, { eth_accounts: {} }
      ),
    }))

    engine.push(this.permissions.providerMiddlewareFunction.bind(
      this.permissions, { origin }
    ))

    return asMiddleware(engine)
  }

  /**
   * Returns the accounts that should be exposed for the given origin domain,
   * if any. This method exists for when a trusted context needs to know
   * which accounts are exposed to a given domain.
   *
   * @param {string} origin - The origin string.
   */
  getAccounts (origin) {
    return new Promise((resolve, _) => {

      const req = { method: 'eth_accounts' }
      const res = {}
      this.permissions.providerMiddlewareFunction(
        { origin }, req, res, () => {}, _end
      )

      function _end () {
        if (res.error || !Array.isArray(res.result)) {
          resolve([])
        } else {
          resolve(res.result)
        }
      }
    })
  }

  /**
   * Submits a permissions request to rpc-cap. Internal, background use only.
   *
   * @param {string} origin - The origin string.
   * @param {IRequestedPermissions} permissions - The requested permissions.
   */
  _requestPermissions (origin, permissions) {
    return new Promise((resolve, reject) => {

      // rpc-cap assigns an id to the request if there is none, as expected by
      // requestUserApproval below
      const req = { method: 'wallet_requestPermissions', params: [permissions] }
      const res = {}
      this.permissions.providerMiddlewareFunction(
        { origin }, req, res, () => {}, _end
      )

      function _end (_err) {
        const err = _err || res.error
        if (err) {
          reject(err)
        } else {
          resolve(res.result)
        }
      }
    })
  }

  /**
   * User approval callback. Resolves the Promise for the permissions request
   * waited upon by rpc-cap, see requestUserApproval in _initializePermissions.
   * The request will be rejected if finalizePermissionsRequest fails.
   *
   * @param {Object} approved - The request object approved by the user
   * @param {Array} accounts - The accounts to expose, if any
   */
  async approvePermissionsRequest (approved, accounts) {

    const { id } = approved.metadata
    const approval = this.pendingApprovals.get(id)

    if (!approval) {
      log.error(`Permissions request with id '${id}' not found`)
      return
    }

    try {

      if (Object.keys(approved.permissions).length === 0) {

        approval.reject(ethErrors.rpc.invalidRequest({
          message: 'Must request at least one permission.',
        }))

      } else {

        // attempt to finalize the request and resolve it,
        // settings caveats as necessary
        approved.permissions = await this.finalizePermissionsRequest(
          approved.permissions, accounts
        )
        approval.resolve(approved.permissions)
      }
    } catch (err) {

      // if finalization fails, reject the request
      approval.reject(ethErrors.rpc.invalidRequest({
        message: err.message, data: err,
      }))
    }

    this._removePendingApproval(id)
  }

  /**
   * User rejection callback. Rejects the Promise for the permissions request
   * waited upon by rpc-cap, see requestUserApproval in _initializePermissions.
   *
   * @param {string} id - The id of the request rejected by the user
   */
  async rejectPermissionsRequest (id) {
    const approval = this.pendingApprovals.get(id)

    if (!approval) {
      log.error(`Permissions request with id '${id}' not found`)
      return
    }

    approval.reject(ethErrors.provider.userRejectedRequest())
    this._removePendingApproval(id)
  }

  /**
   * @deprecated
   * Grants the given origin the eth_accounts permission for the given account(s).
   * This method should ONLY be called as a result of direct user action in the UI,
   * with the intention of supporting legacy dapps that don't support EIP 1102.
   *
   * @param {string} origin - The origin to expose the account(s) to.
   * @param {Array<string>} accounts - The account(s) to expose.
   */
  async legacyExposeAccounts (origin, accounts) {

    // accounts are validated by finalizePermissionsRequest
    if (typeof origin !== 'string' || !origin.length) {
      throw new Error('Must provide non-empty string origin.')
    }

    const existingAccounts = await this.getAccounts(origin)

    if (existingAccounts.length > 0) {
      throw new Error(
        'May not call legacyExposeAccounts on origin with exposed accounts.'
      )
    }

    const permissions = await this.finalizePermissionsRequest(
      { eth_accounts: {} }, accounts
    )

    try {

      await new Promise((resolve, reject) => {
        this.permissions.grantNewPermissions(
          origin, permissions, {}, _end
        )

        function _end (err) {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      })

      this.notifyDomain(origin, {
        method: NOTIFICATION_NAMES.accountsChanged,
        result: accounts,
      })
      this.permissionsLog.logAccountExposure(origin, accounts)

    } catch (error) {

      throw ethErrors.rpc.internal({
        message: `Failed to add 'eth_accounts' to '${origin}'.`,
        data: {
          originalError: error,
          accounts,
        },
      })
    }
  }

  /**
   * Update the accounts exposed to the given origin. Changes the eth_accounts
   * permissions and emits accountsChanged.
   * At least one account must be exposed. If no accounts are to be exposed, the
   * eth_accounts permissions should be removed completely.
   *
   * Throws error if the update fails.
   *
   * @param {string} origin - The origin to change the exposed accounts for.
   * @param {string[]} accounts - The new account(s) to expose.
   */
  async updatePermittedAccounts (origin, accounts) {

    await this.validatePermittedAccounts(accounts)

    this.permissions.updateCaveatFor(
      origin, 'eth_accounts', CAVEAT_NAMES.exposedAccounts, accounts
    )

    this.notifyDomain(origin, {
      method: NOTIFICATION_NAMES.accountsChanged,
      result: accounts,
    })
  }

  /**
   * Finalizes a permissions request. Throws if request validation fails.
   * Clones the passed-in parameters to prevent inadvertent modification.
   * Sets (adds or replaces) caveats for the following permissions:
   * - eth_accounts: the permitted accounts caveat
   *
   * @param {Object} requestedPermissions - The requested permissions.
   * @param {string[]} requestedAccounts - The accounts to expose, if any.
   * @returns {Object} The finalized permissions request object.
   */
  async finalizePermissionsRequest (requestedPermissions, requestedAccounts) {

    const finalizedPermissions = cloneDeep(requestedPermissions)
    const finalizedAccounts = cloneDeep(requestedAccounts)

    const { eth_accounts: ethAccounts } = finalizedPermissions

    if (ethAccounts) {

      await this.validatePermittedAccounts(finalizedAccounts)

      if (!ethAccounts.caveats) {
        ethAccounts.caveats = []
      }

      // caveat names are unique, and we will only construct this caveat here
      ethAccounts.caveats = ethAccounts.caveats.filter((c) => (
        c.name !== CAVEAT_NAMES.exposedAccounts
      ))

      ethAccounts.caveats.push(
        {
          type: 'filterResponse',
          value: finalizedAccounts,
          name: CAVEAT_NAMES.exposedAccounts,
        },
      )
    }

    return finalizedPermissions
  }

  /**
   * Validate an array of accounts representing accounts to be exposed
   * to a domain. Throws error if validation fails.
   *
   * @param {string[]} accounts - An array of addresses.
   */
  async validatePermittedAccounts (accounts) {

    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('Must provide non-empty array of account(s).')
    }

    // assert accounts exist
    const allAccounts = await this.getKeyringAccounts()
    accounts.forEach((acc) => {
      if (!allAccounts.includes(acc)) {
        throw new Error(`Unknown account: ${acc}`)
      }
    })
  }

  notifyDomain (origin, payload) {

    // if the accounts changed from the perspective of the dapp,
    // update "last seen" time for the origin and account(s)
    // exception: no accounts -> no times to update
    if (
      payload.method === NOTIFICATION_NAMES.accountsChanged &&
      Array.isArray(payload.result)
    ) {
      this.permissionsLog.updateAccountsHistory(
        origin, payload.result
      )
    }

    this._notifyDomain(origin, payload)

    // NOTE:
    // we don't check for accounts changing in the notifyAllDomains case,
    // because the log only records when accounts were last seen,
    // and the accounts only change for all domains at once when permissions
    // are removed
  }

  /**
   * Removes the given permissions for the given domain.
   * Should only be called after confirming that the permissions exist, to
   * avoid sending unnecessary notifications.
   *
   * @param {Object} domains { origin: [permissions] }
   */
  removePermissionsFor (domains) {

    Object.entries(domains).forEach(([origin, perms]) => {

      this.permissions.removePermissionsFor(
        origin,
        perms.map((methodName) => {

          if (methodName === 'eth_accounts') {
            this.notifyDomain(
              origin,
              { method: NOTIFICATION_NAMES.accountsChanged, result: [] }
            )
          }

          return { parentCapability: methodName }
        })
      )
    })
  }

  /**
   * When a new account is selected in the UI for 'origin', emit accountsChanged
   * to 'origin' if the selected account is permitted.
   *
   * Note: This will emit "false positive" accountsChanged events, but they are
   * handled by the inpage provider.
   *
   * @param {string} origin - The origin.
   * @param {string} account - The newly selected account's address.
   */
  async handleNewAccountSelected (origin, account) {

    const permittedAccounts = await this.getAccounts(origin)

    if (
      typeof origin !== 'string' || !origin.length ||
      typeof account !== 'string' || !account.length
    ) {
      throw new Error('Should provide non-empty origin and account strings.')
    }

    // do nothing if the account is not permitted for the origin, or
    // if it's already first in the array of permitted accounts
    if (
      !permittedAccounts.includes(account) ||
      permittedAccounts[0] === account
    ) {
      return
    }

    const newPermittedAccounts = [account].concat(
      permittedAccounts.filter((_account) => _account !== account)
    )

    // update permitted accounts to ensure that accounts are returned
    // in the same order every time
    await this.updatePermittedAccounts(origin, newPermittedAccounts)
  }

  /**
   * Removes all known domains and their related permissions.
   */
  clearPermissions () {
    this.permissions.clearDomains()
    this.notifyAllDomains({
      method: NOTIFICATION_NAMES.accountsChanged,
      result: [],
    })
  }

  /**
   * Adds a pending approval.
   * @param {string} id - The id of the pending approval.
   * @param {string} origin - The origin of the pending approval.
   * @param {Function} resolve - The function resolving the pending approval Promise.
   * @param {Function} reject - The function rejecting the pending approval Promise.
   */
  _addPendingApproval (id, origin, resolve, reject) {

    if (
      this.pendingApprovalOrigins.has(origin) ||
      this.pendingApprovals.has(id)
    ) {
      throw new Error(
        `Pending approval with id ${id} or origin ${origin} already exists.`
      )
    }

    this.pendingApprovals.set(id, { origin, resolve, reject })
    this.pendingApprovalOrigins.add(origin)
  }

  /**
   * Removes the pending approval with the given id.
   * @param {string} id - The id of the pending approval to remove.
   */
  _removePendingApproval (id) {
    const { origin } = this.pendingApprovals.get(id)
    this.pendingApprovalOrigins.delete(origin)
    this.pendingApprovals.delete(id)
  }

  /**
   * A convenience method for retrieving a login object
   * or creating a new one if needed.
   *
   * @param {string} origin = The origin string representing the domain.
   */
  _initializePermissions (restoredState) {

    // these permission requests are almost certainly stale
    const initState = { ...restoredState, permissionsRequests: [] }

    this.permissions = new RpcCap({

      // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

      // optional prefix for internal methods
      methodPrefix: WALLET_PREFIX,

      restrictedMethods: this._restrictedMethods,

      /**
       * A promise-returning callback used to determine whether to approve
       * permissions requests or not.
       *
       * Currently only returns a boolean, but eventually should return any
       * specific parameters or amendments to the permissions.
       *
       * @param {string} req - The internal rpc-cap user request object.
       */
      requestUserApproval: async (req) => {
        const { origin, metadata: { id } } = req

        if (this.pendingApprovalOrigins.has(origin)) {
          throw ethErrors.rpc.resourceUnavailable(
            'Permissions request already pending; please wait.'
          )
        }

        this._platform.openExtensionInBrowser(`connect/${id}`)

        return new Promise((resolve, reject) => {
          this._addPendingApproval(id, origin, resolve, reject)
        })
      },
    }, initState)
  }
}

export function addInternalMethodPrefix (method) {
  return WALLET_PREFIX + method
}
