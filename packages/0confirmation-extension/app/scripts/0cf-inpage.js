/*global Web3*/

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
//let __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
const log = require('loglevel')
const { ethErrors, serializeError } = require('eth-json-rpc-errors')
const SafeEventEmitter = require('safe-event-emitter')
const EventEmitter = require('events')
function createErrorMiddleware () {
  return (req, res, next) => {

    // json-rpc-engine will terminate the request when it notices this error
    if (!req.method || typeof req.method !== 'string') {
      res.error = ethErrors.rpc.invalidRequest({
        message: `The request 'method' must be a non-empty string.`,
        data: req,
      })
    }

    next(done => {
      const { error } = res
      if (!error) {
        return done()
      }
      serializeError(error)
      log.error(`MetaMask - RPC Error: ${error.message}`, error)
      done()
    })
  }
}

/**
 * Logs a stream disconnection error. Emits an 'error' if bound to an
 * EventEmitter that has listeners for the 'error' event.
 *
 * @param {string} remoteLabel - The label of the disconnected stream.
 * @param {Error} err - The associated error to log.
 */
function logStreamDisconnectWarning (remoteLabel, err) {
  let warningMsg = `MetamaskInpageProvider - lost connection to ${remoteLabel}`
  if (err) {
    warningMsg += '\n' + err.stack
  }
  log.warn(warningMsg)
  if (this instanceof EventEmitter || this instanceof SafeEventEmitter) {
    if (this.listenerCount('error') > 0) {
      this.emit('error', warningMsg)
    }
  }
}

/**
 * TODO:deprecate:2020-Q1
 * Adds hidden "then" and "catch" properties to the given object. When returned
 * from a function, the given object will appear unchanged. If, however, the
 * caller expects a Promise, it will behave like a Promise that resolves to
 * the value of the indicated property.
 *
 * @param {Object} obj - The object to make thenable.
 * @param {string} prop - The property whose value the object's then function resolves to.
 * @returns {Object} - The secretly thenable object.
 */
function makeThenable (obj, prop) {

  // don't do anything to Promises
  if (obj instanceof Promise) {
    return obj
  }

  const defineOpts = {
    configurable: true, writable: true, enumerable: false,
  }

  // strange wrapping of Promise functions to fully emulate .then behavior,
  // specifically Promise chaining
  // there may be a simpler way of doing it, but this works
  const thenFunction = (consumerResolve, consumerCatch) => {
    return Promise.resolve().then(() => consumerResolve(obj[prop]), consumerCatch)
  }

  Object.defineProperty(obj, 'then', { ...defineOpts, value: thenFunction })

  // the Promise will never fail in our usage, so just make a no-op "catch"
  Object.defineProperty(obj, 'catch', { ...defineOpts, value: Promise.prototype.catch })

  Object.defineProperty(obj, 'finally', { ...defineOpts, value: Promise.prototype.finally })

  return obj
}
const pump = require('pump')
const RpcEngine = require('json-rpc-engine')
const createIdRemapMiddleware = require('json-rpc-engine/src/idRemapMiddleware')
const createJsonRpcStream = require('json-rpc-middleware-stream')
const ObservableStore = require('obs-store')
const asStream = require('obs-store/lib/asStream')
const ObjectMultiplex = require('obj-multiplex')
const dequal = require('fast-deep-equal')

const messages = {
  errors: {
    invalidParams: () => `MetaMask: Invalid request parameters. Please use ethereum.send(method: string, params: Array<any>). For more details, see: https://eips.ethereum.org/EIPS/eip-1193`,
    sendSiteMetadata: () => `MetaMask: Failed to send site metadata. This is an internal error, please report this bug.`,
    unsupportedSync: (method) => `MetaMask: The MetaMask Web3 object does not support synchronous methods like ${method} without a callback parameter.`, // TODO:deprecate:2020-Q1
  },
  warnings: {
    // TODO:deprecate:2020-Q1
    autoReloadDeprecation: `MetaMask: MetaMask will stop reloading pages on network change in Q1 2020. For more information, see: https://medium.com/metamask/no-longer-reloading-pages-on-network-change-fbf041942b44 \nSet 'ethereum.autoRefreshOnNetworkChange' to 'false' to silence this warning: https://metamask.github.io/metamask-docs/API_Reference/Ethereum_Provider#ethereum.autorefreshonnetworkchange`,
    sendSyncDeprecation: `MetaMask: 'ethereum.send(...)' will return result-resolving Promises for all methods starting in Q1 2020. For more information, see: https://medium.com/metamask/deprecating-synchronous-provider-methods-82f0edbc874b`,
    // deprecated stuff yet to be scheduled for removal
    enableDeprecation: `MetaMask: 'ethereum.enable()' is deprecated and may be removed in the future. Please use "ethereum.send('eth_requestAccounts')" instead. For more information, see: https://eips.ethereum.org/EIPS/eip-1102`,
    isConnectedDeprecation: `MetaMask: 'ethereum.isConnected()' is deprecated and may be removed in the future. Please listen for the relevant events instead. For more information, see: https://eips.ethereum.org/EIPS/eip-1193`,
    sendAsyncDeprecation: `MetaMask: 'ethereum.sendAsync(...)' is deprecated and may be removed in the future. Please use 'ethereum.send(method: string, params: Array<any>)' instead. For more information, see: https://eips.ethereum.org/EIPS/eip-1193`,
    // misc
    experimentalMethods: `MetaMask: 'ethereum._metamask' exposes non-standard, experimental methods. They may be removed or changed without warning.`,
  }
};
const { errors } = messages;

function sendSiteMetadata (engine) {
  return getSiteMetadata().then((domainMetadata) => {
    // call engine.handle directly to avoid normal RPC request handling
    engine.handle(
      {
        method: 'wallet_sendDomainMetadata',
        domainMetadata,
      },
      () => {},
    )
  }).catch((error) => {
    console.error({
      message: errors.sendSiteMetadata(),
      originalError: error,
    })
  });
}

/**
 * Gets site metadata and returns it
 *
 */
function getSiteMetadata () {
  return Promise.all([
    getSiteName(window),
    getSiteIcon(window)
  ]).then(([ name, icon ]) => ({
    name,
    icon
  }));
}

/**
 * Extracts a name for the site from the DOM
 */
function getSiteName (window) {
  const document = window.document

  const siteName = document.querySelector('head > meta[property="og:site_name"]')
  if (siteName) {
    return siteName.content
  }

  const metaTitle = document.querySelector('head > meta[name="title"]')
  if (metaTitle) {
    return metaTitle.content
  }

  if (document.title && document.title.length > 0) {
    return document.title
  }

  return window.location.hostname
}

/**
 * Extracts an icon for the site from the DOM
 */
function getSiteIcon (window) {
  const document = window.document

  // Use the site's favicon if it exists
  let icon = document.querySelector('head > link[rel="shortcut icon"]')
  return (icon && resourceExists(icon.href).then(() => icon.href) || Promise.resolve().then(() => {
    icon = Array.from(document.querySelectorAll('head > link[rel="icon"]'))
      .find((icon) => Boolean(icon.href))
    return (icon && resourceExists(icon.href).then(() => icon.href) || null);
  }));
}

/**
 * Returns whether the given resource exists
 * @param {string} url the url of the resource
 */
function resourceExists (url) {
  return fetch(url, { method: 'HEAD', mode: 'same-origin' })
    .then(res => res.status === 200)
    .catch(_ => false)
}

// resolve response.result, reject errors
const getRpcPromiseCallback = (resolve, reject) => (error, response) => {
  error || response.error
    ? reject(error || response.error)
    : Array.isArray(response)
      ? resolve(response)
      : resolve(response.result)
}

ZeroInpageProvider.prototype.__proto__ = SafeEventEmitter.prototype;
function ZeroInpageProvider(connectionStream, shouldSendMetadata) {
  if (shouldSendMetadata === undefined) shouldSendMetadata = true;
  SafeEventEmitter.call(this);
  const self = this;
  console.log('woop');
  this.setMaxListeners(25);
  this.isMetamask = true

  // private state, kept here in part for use in the _metamask proxy
  this._state = {
    sentWarnings: {
      enable: false,
      experimentalMethods: false,
      isConnected: false,
      sendAsync: false,
      // TODO:deprecate:2020-Q1
      autoReload: false,
      sendSync: false,
    },
    isConnected: undefined,
    accounts: undefined,
    isUnlocked: true,
  }

  this._metamask = getExperimentalApi(this)

  // public state
  this.selectedAddress = null
  this.networkVersion = undefined
  this.chainId = undefined

  // bind functions (to prevent e.g. web3@1.x from making unbound calls)
  this._handleAccountsChanged = this._handleAccountsChanged.bind(this)
  this._handleDisconnect = this._handleDisconnect.bind(this)
  this._sendAsync = this._sendAsync.bind(this)
  this._sendSync = this._sendSync.bind(this)
  this.enable = this.enable.bind(this)
  this.send = this.send.bind(this)
  this.sendAsync = this.sendAsync.bind(this)

  // setup connectionStream multiplexing
  const mux = this.mux = new ObjectMultiplex()
  pump(
    connectionStream,
    mux,
    connectionStream,
    this._handleDisconnect.bind(this, 'Zero'),
  )

  // subscribe to metamask public config (one-way)
  this._publicConfigStore = new ObservableStore({ storageKey: 'Zero-Config' })

  // handle isUnlocked changes, and chainChanged and networkChanged events
  this._publicConfigStore.subscribe(state => {

    if ('isUnlocked' in state && state.isUnlocked !== this._state.isUnlocked) {
      this._state.isUnlocked = state.isUnlocked
      if (!this._state.isUnlocked) {
        // accounts are never exposed when the extension is locked
        this._handleAccountsChanged([])
      } else {
        // this will get the exposed accounts, if any
        try {
          this._sendAsync(
            { method: 'eth_accounts', params: [] },
            () => {},
            true, // indicating that eth_accounts _should_ update accounts
          )
        } catch (_) {}
      }
    }

    // Emit chainChanged event on chain change
    if ('chainId' in state && state.chainId !== this.chainId) {
      this.chainId = state.chainId
      this.emit('chainChanged', this.chainId)
      this.emit('chainIdChanged', this.chainId) // TODO:deprecate:2020-Q1
    }

    // Emit networkChanged event on network change
    if ('networkVersion' in state && state.networkVersion !== this.networkVersion) {
      this.networkVersion = state.networkVersion
      this.emit('networkChanged', this.networkVersion)
    }
  })

  pump(
    mux.createStream('zeroPublicConfig'),
    asStream(this._publicConfigStore),
    // RPC requests should still work if only this stream fails
    logStreamDisconnectWarning.bind(this, 'Zero PublicConfigStore'),
  )

  // ignore phishing warning message (handled elsewhere)
  mux.ignoreStream('phishing')

  // setup own event listeners

  // EIP-1193 connect
  this.on('connect', () => {
    this._state.isConnected = true
  })

  // connect to async provider

  const jsonRpcConnection = createJsonRpcStream()
  pump(
    jsonRpcConnection.stream,
    mux.createStream('zeroProvider'),
    jsonRpcConnection.stream,
    this._handleDisconnect.bind(this, 'ZeroMask RpcProvider'),
  )

  // handle RPC requests via dapp-side rpc engine
  const rpcEngine = new RpcEngine()
  rpcEngine.push(createIdRemapMiddleware())
  rpcEngine.push(createErrorMiddleware())
  rpcEngine.push(jsonRpcConnection.middleware)
  this._rpcEngine = rpcEngine

  // json rpc notification listener
  jsonRpcConnection.events.on('notification', payload => {
    if (payload.method === 'wallet_accountsChanged') {
      this._handleAccountsChanged(payload.result)
    } else if (payload.method === 'eth_subscription') {
      // EIP 1193 subscriptions, per eth-json-rpc-filters/subscriptionManager
      this.emit('notification', payload.params.result)
    } else if (payload.method === '0cf_queryProvider') {
      this.cachedSend(payload.params[0]).then((response) => this._rpcEngine.handle(Object.assign({
        method: '0cf_queryProvider',
        id: payload.id,
        params: [ response ]
      }), () => {}));
    }
  })

  // send website metadata
  if (shouldSendMetadata) {
    const domContentLoadedHandler = () => {
      sendSiteMetadata(this._rpcEngine)
      window.removeEventListener('DOMContentLoaded', domContentLoadedHandler)
    }
    window.addEventListener('DOMContentLoaded', domContentLoadedHandler)
  }

  // indicate that we've connected, for EIP-1193 compliance
  setTimeout(() => this.emit('connect'))

  // TODO:deprecate:2020-Q1
  this._web3Ref = undefined

  // TODO:deprecate:2020-Q1
  // give the dapps control of a refresh they can toggle this off on the window.ethereum
  // this will be default true so it does not break any old apps.
  this.autoRefreshOnNetworkChange = true

  // TODO:deprecate:2020-Q1
  // wait a second to attempt to send this, so that the warning can be silenced
  // moved this here because there's another warning in .enable() discouraging
  // the use thereof per EIP 1102
  setTimeout(() => {
    if (this.autoRefreshOnNetworkChange && !this._state.sentWarnings.autoReload) {
      log.warn(messages.warnings.autoReloadDeprecation)
      this._state.sentWarnings.autoReload = true
    }
  }, 1000)
}

Object.assign(ZeroInpageProvider.prototype, {
  /**
   * Deprecated.
   * Returns whether the inpage provider is connected to MetaMask.
   */
  isConnected () {

    if (!this._state.sentWarnings.isConnected) {
      log.warn(messages.warnings.isConnectedDeprecation)
      this._state.sentWarnings.isConnected = true
    }
    return this._state.isConnected
  },

  connect(metamaskProvider) {
    this.hijackedProvider = metamaskProvider;
    this.cachedSend = this.hijackedProvider.send;
    this.capture() // 0cf mvp -- let's just capture it always
  },

  useCachedSend(...args) {
    return this.cachedSend.apply(this.hijackedProvider, args);
  },
  
  capture() {
    this.hijackedProvider.send = (...args) => this.send(...args);
  },

  release() {
    this.hijackedProvider.send = this.cachedSend;
  },

  /**
   * Sends an RPC request to MetaMask. Resolves to the result of the method call.
   * May reject with an error that must be caught by the caller.
   *
   * @param {(string|Object)} methodOrPayload - The method name, or the RPC request object.
   * @param {Array<any>} [params] - If given a method name, the method's parameters.
   * @returns {Promise<any>} - A promise resolving to the result of the method call.
   */
  send (methodOrPayload, params) {
    // preserve original params for later error if necessary
    const method = !params && methodOrPayload.method || methodOrPayload;
    if (['personal_sign', 'eth_signTypedData', 'eth_sign'].includes(method)) throw Error('Borrow proxy cannot sign messages -- turn off the 0cf extension to use this functionality with your own wallet');
    if (!['eth_accounts', 'eth_sendTransaction'].includes(!params && methodOrPayload.method || methodOrPayload)) return this.useCachedSend(methodOrPayload, params);
      
    const _params = params

    // construct payload object
    let payload
    if (
      methodOrPayload &&
      typeof methodOrPayload === 'object' &&
      !Array.isArray(methodOrPayload)
    ) {

      // TODO:deprecate:2020-Q1
      // handle send(object, callback), an alias for sendAsync(object, callback)
      if (typeof params === 'function') {
        return this._sendAsync(methodOrPayload, params)
      }

      payload = methodOrPayload

      // TODO:deprecate:2020-Q1
      // backwards compatibility: "synchronous" methods
      if (!params && [
        'eth_accounts',
        'eth_coinbase',
        'eth_uninstallFilter',
        'net_version',
      ].includes(payload.method)) {
        return this._sendSync(payload)
      }
    } else if (
      typeof methodOrPayload === 'string' &&
      typeof params !== 'function'
    ) {

      // wrap params in array out of kindness
      // params have to be an array per EIP 1193, even though JSON RPC
      // allows objects
      if (params === undefined) {
        params = []
      } else if (!Array.isArray(params)) {
        params = [params]
      }

      payload = {
        method: methodOrPayload,
        params,
      }
    }

    // typecheck payload and payload.params
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      !Array.isArray(params)
    ) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidParams(),
        data: [methodOrPayload, _params],
      })
    }

    return new Promise((resolve, reject) => {
      try {
        this._sendAsync(
          payload,
          getRpcPromiseCallback(resolve, reject),
        )
      } catch (error) {
        reject(error)
      }
    })
  },

  /**
   * Deprecated.
   * Equivalent to: ethereum.send('eth_requestAccounts')
   *
   * @returns {Promise<Array<string>>} - A promise that resolves to an array of addresses.
   */
  enable () {

    if (!this._state.sentWarnings.enable) {
      log.warn(messages.warnings.enableDeprecation)
      this._state.sentWarnings.enable = true
    }
    return new Promise((resolve, reject) => {
      try {
        this._sendAsync(
          { method: 'eth_requestAccounts', params: [] },
          getRpcPromiseCallback(resolve, reject),
        )
      } catch (error) {
        reject(error)
      }
    })
  },

  /**
   * Deprecated.
   * Backwards compatibility. ethereum.send() with callback.
   *
   * @param {Object} payload - The RPC request object.
   * @param {Function} callback - The callback function.
   */
  sendAsync (payload, cb) {

    if (!this._state.sentWarnings.sendAsync) {
      log.warn(messages.warnings.sendAsyncDeprecation)
      this._state.sentWarnings.sendAsync = true
    }
    this._sendAsync(payload, cb)
  },

  /**
   * TODO:deprecate:2020-Q1
   * Internal backwards compatibility method.
   */
  _sendSync (payload) {

    if (!this._state.sentWarnings.sendSync) {
      log.warn(messages.warnings.sendSyncDeprecation)
      this._state.sentWarnings.sendSync = true
    }

    let result
    switch (payload.method) {

      case 'eth_accounts':
        result = this.selectedAddress ? [this.selectedAddress] : []
        break

      case 'eth_coinbase':
        result = this.selectedAddress || null
        break

      case 'eth_uninstallFilter':
        this._sendAsync(payload, () => {})
        result = true
        break

      case 'net_version':
        result = this.networkVersion || null
        break

      default:
        throw new Error(messages.errors.unsupportedSync(payload.method))
    }

    // looks like a plain object, but behaves like a Promise if someone calls .then on it :evil_laugh:
    return makeThenable({
      id: payload.id,
      jsonrpc: payload.jsonrpc,
      result,
    }, 'result')
  },

  /**
   * Internal RPC method. Forwards requests to background via the RPC engine.
   * Also remap ids inbound and outbound.
   *
   * @param {Object} payload - The RPC request object.
   * @param {Function} userCallback - The caller's callback.
   * @param {boolean} isInternal - Whether the request is internal.
   */
  _sendAsync (payload, userCallback, isInternal = false) {

    let cb = userCallback

    if (!Array.isArray(payload)) {

      if (!payload.jsonrpc) {
        payload.jsonrpc = '2.0'
      }

      if (
        payload.method === 'eth_accounts' ||
        payload.method === 'eth_requestAccounts'
      ) {

        // handle accounts changing
        cb = (err, res) => {
          this._handleAccountsChanged(
            res.result || [],
            payload.method === 'eth_accounts',
            isInternal,
          )
          userCallback(err, res)
        }
      }
    }

    this._rpcEngine.handle(payload, cb)
  },

  /**
   * Called when connection is lost to critical streams.
   */
  _handleDisconnect (streamName, err) {

    logStreamDisconnectWarning.bind(this)(streamName, err)
    if (this._state.isConnected) {
      this.emit('close', {
        code: 1011,
        reason: 'MetaMask background communication error.',
      })
    }
    this._state.isConnected = false
  },

  /**
   * Called when accounts may have changed.
   */
  _handleAccountsChanged (accounts, isEthAccounts = false, isInternal = false) {

    // defensive programming
    if (!Array.isArray(accounts)) {
      log.error(
        'Zero: Received non-array accounts parameter. Please report this bug.',
        accounts,
      )
      accounts = []
    }

    // emit accountsChanged if anything about the accounts array has changed
    if (!dequal(this._state.accounts, accounts)) {

      // we should always have the correct accounts even before eth_accounts
      // returns, except in cases where isInternal is true
      if (isEthAccounts && this._state.accounts !== undefined && !isInternal) {
        log.error(
          `MetaMask: 'eth_accounts' unexpectedly updated accounts. Please report this bug.`,
          accounts,
        )
      }

      this.emit('accountsChanged', accounts)
      this._state.accounts = accounts
    }

    // handle selectedAddress
    if (this.selectedAddress !== accounts[0]) {
      this.selectedAddress = accounts[0] || null
    }

    // TODO:deprecate:2020-Q1
    // handle web3
    if (this._web3Ref) {
      this._web3Ref.defaultAccount = this.selectedAddress
    } else if (
      window.web3 &&
      window.web3.eth &&
      typeof window.web3.eth === 'object'
    ) {
      window.web3.eth.defaultAccount = this.selectedAddress
    }
  }
});

/**
 * Gets experimental _metamask API as Proxy.
 */
function getExperimentalApi (instance) {
  return new Proxy(
    {

      /**
       * Determines if MetaMask is unlocked by the user.
       *
       * @returns {Promise<boolean>} - Promise resolving to true if MetaMask is currently unlocked
       */
      isUnlocked: () => {
        return (instance._state.isUnlocked === undefined ? new Promise(
            (resolve) => instance._publicConfigStore.once('update', () => resolve()),
          ) : Promise.resolve()).then(() => instance._state.isUnlocked);
      },

      /**
       * Make a batch request.
       */
      sendBatch: (requests) => {

        // basic input validation
        if (!Array.isArray(requests)) {
          throw ethErrors.rpc.invalidRequest({
            message: 'Batch requests must be made with an array of request objects.',
            data: requests,
          })
        }

        return new Promise((resolve, reject) => {
          try {
            instance._sendAsync(
              requests,
              getRpcPromiseCallback(resolve, reject),
            )
          } catch (error) {
            reject(error)
          }
        })
      },

      // TODO:deprecate:2020-Q1 isEnabled, isApproved
      /**
       * Deprecated. Will be removed in Q1 2020.
       * Synchronously determines if this domain is currently enabled, with a potential false negative if called to soon
       *
       * @returns {boolean} - returns true if this domain is currently enabled
       */
      isEnabled: () => {
        return Array.isArray(instance._state.accounts) && instance._state.accounts.length > 0
      },

      /**
       * Deprecated. Will be removed in Q1 2020.
       * Asynchronously determines if this domain is currently enabled
       *
       * @returns {Promise<boolean>} - Promise resolving to true if this domain is currently enabled
       */
      isApproved: () => {
        return (instance._state.accounts === undefined ? new Promise(
            (resolve) => instance.once('accountsChanged', () => resolve()),
          ) : Promise.resolve()).then(() => Array.isArray(instance._state.accounts) && instance._state.accounts.length > 0);
      },
    },
    {
      get: (obj, prop) => {

        if (!instance._state.sentWarnings.experimentalMethods) {
          log.warn(messages.warnings.experimentalMethods)
          instance._state.sentWarnings.experimentalMethods = true
        }
        return obj[prop]
      },
    },
  )
}

const zeroCleanContextForImports = () => {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('Zero - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
const zeroRestoreContextAfterImports = () => {
  try {
    global.define = __define
  } catch (_) {
    console.warn('Zero - global.define could not be overwritten.')
  }
}

//zeroCleanContextForImports()

import LocalMessageDuplexStream from 'post-message-stream'

// TODO:deprecate:Q1-2020

//import setupDappAutoReload from './lib/auto-reload.js'

//zeroRestoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
const zeroStream = new LocalMessageDuplexStream({
  name: '0cf-inpage',
  target: '0cf-contentscript',
})
const zeroInpageProvider = new ZeroInpageProvider(zeroStream);

// compose the inpage provider

// Work around for web3@1.0 deleting the bound `sendAsync` but not the unbound
// `sendAsync` method on the prototype, causing `this` reference issues

//
// TODO:deprecate:Q1-2020
//

// setup web3


// setup dapp auto reload AND proxy web3
//setupDappAutoReload(web3, inpageProvider._publicConfigStore)

//
// end deprecate:Q1-2020
//

(function poll() {
  let ticks = 0;
  if (window.ethereum) {
    zeroInpageProvider.connect(window.ethereum);
    return Promise.resolve();
  } else {
    ticks++;
    if (ticks === 10) { // we can't wait for a metamask forever
      log.debug('couldn\'t find a MetaMask here');
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, 500)).then(poll);
  }
})().catch((err) => log.debug(err.message));
