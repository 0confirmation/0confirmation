import { createSelector } from 'reselect'
import {
  UNAPPROVED_STATUS,
  APPROVED_STATUS,
  SUBMITTED_STATUS,
  CONFIRMED_STATUS,
} from '../helpers/constants/transactions'
import {
  TRANSACTION_TYPE_CANCEL,
  TRANSACTION_TYPE_RETRY,
} from '../../../app/scripts/controllers/transactions/enums'
import { hexToDecimal } from '../helpers/utils/conversions.util'
import { selectedTokenAddressSelector } from './tokens'
import { getFastPriceEstimateInHexWEI } from './custom-gas'
import {
  getIsMainnet,
  getSelectedToken,
  getSelectedAddress,
} from './selectors'
import txHelper from '../../lib/tx-helper'

export const shapeShiftTxListSelector = (state) => {
  if (getIsMainnet(state)) {
    return state.metamask.shapeShiftTxList
  }
  return []
}

export const incomingTxListSelector = (state) => {
  const { showIncomingTransactions } = state.metamask.featureFlags
  if (!showIncomingTransactions) {
    return []
  }

  const network = state.metamask.network
  const selectedAddress = getSelectedAddress(state)
  return Object.values(state.metamask.incomingTransactions)
    .filter(({ metamaskNetworkId, txParams }) => (
      txParams.to === selectedAddress && metamaskNetworkId === network
    ))
}
export const unapprovedMsgsSelector = (state) => state.metamask.unapprovedMsgs
export const currentNetworkTxListSelector = (state) => state.metamask.currentNetworkTxList
export const unapprovedPersonalMsgsSelector = (state) => state.metamask.unapprovedPersonalMsgs
export const unapprovedDecryptMsgsSelector = (state) => state.metamask.unapprovedDecryptMsgs
export const unapprovedEncryptionPublicKeyMsgsSelector = (state) => state.metamask.unapprovedEncryptionPublicKeyMsgs
export const unapprovedTypedMessagesSelector = (state) => state.metamask.unapprovedTypedMessages
export const networkSelector = (state) => state.metamask.network

export const selectedAddressTxListSelector = createSelector(
  getSelectedAddress,
  currentNetworkTxListSelector,
  (selectedAddress, transactions = []) => {
    return transactions.filter(({ txParams }) => txParams.from === selectedAddress)
  }
)

export const unapprovedMessagesSelector = createSelector(
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  (
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    network
  ) => txHelper(
    {},
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedDecryptMsgs,
    unapprovedEncryptionPublicKeyMsgs,
    unapprovedTypedMessages,
    network
  ) || []
)

const pendingStatusHash = {
  [UNAPPROVED_STATUS]: true,
  [APPROVED_STATUS]: true,
  [SUBMITTED_STATUS]: true,
}

const priorityStatusHash = {
  ...pendingStatusHash,
  [CONFIRMED_STATUS]: true,
}

export const transactionSubSelector = createSelector(
  unapprovedMessagesSelector,
  shapeShiftTxListSelector,
  incomingTxListSelector,
  (unapprovedMessages = [], shapeShiftTxList = [], incomingTxList = []) => {
    return unapprovedMessages.concat(shapeShiftTxList, incomingTxList)
  }
)

const transactionSelectorReturnHelper = (selectedTokenAddress, transactions) => {
  return selectedTokenAddress
    ? transactions
      .filter(({ txParams }) => txParams && txParams.to === selectedTokenAddress)
      .sort((a, b) => b.time - a.time)
    : transactions
      .sort((a, b) => b.time - a.time)
}

export const transactionsSelector = createSelector(
  selectedTokenAddressSelector,
  transactionSubSelector,
  selectedAddressTxListSelector,
  (selectedTokenAddress, subSelectorTxList = [], selectedAddressTxList = []) => {
    const txsToRender = selectedAddressTxList.concat(subSelectorTxList)

    return transactionSelectorReturnHelper(selectedTokenAddress, txsToRender)
  }
)

/**
 * @name insertOrderedNonce
 * @private
 * @description Inserts (mutates) a nonce into an array of ordered nonces, sorted in ascending
 * order.
 * @param {string[]} nonces - Array of nonce strings in hex
 * @param {string} nonceToInsert - Nonce string in hex to be inserted into the array of nonces.
 * @returns {string[]}
 */
const insertOrderedNonce = (nonces, nonceToInsert) => {
  let insertIndex = nonces.length

  for (let i = 0; i < nonces.length; i++) {
    const nonce = nonces[i]

    if (Number(hexToDecimal(nonce)) > Number(hexToDecimal(nonceToInsert))) {
      insertIndex = i
      break
    }
  }

  nonces.splice(insertIndex, 0, nonceToInsert)
}

/**
 * @name insertTransactionByTime
 * @private
 * @description Inserts (mutates) a transaction object into an array of ordered transactions, sorted
 * in ascending order by time.
 * @param {Object[]} transactions - Array of transaction objects.
 * @param {Object} transaction - Transaction object to be inserted into the array of transactions.
 * @returns {Object[]}
 */
const insertTransactionByTime = (transactions, transaction) => {
  const { time } = transaction

  let insertIndex = transactions.length

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]

    if (tx.time > time) {
      insertIndex = i
      break
    }
  }

  transactions.splice(insertIndex, 0, transaction)
}

/**
 * Contains transactions and properties associated with those transactions of the same nonce.
 * @typedef {Object} transactionGroup
 * @property {string} nonce - The nonce that the transactions within this transactionGroup share.
 * @property {Object[]} transactions - An array of transaction (txMeta) objects.
 * @property {Object} initialTransaction - The transaction (txMeta) with the lowest "time".
 * @property {Object} primaryTransaction - Either the latest transaction or the confirmed
 * transaction.
 * @property {boolean} hasRetried - True if a transaction in the group was a retry transaction.
 * @property {boolean} hasCancelled - True if a transaction in the group was a cancel transaction.
 */

/**
 * @name insertTransactionGroupByTime
 * @private
 * @description Inserts (mutates) a transactionGroup object into an array of ordered
 * transactionGroups, sorted in ascending order by nonce.
 * @param {transactionGroup[]} transactionGroups - Array of transactionGroup objects.
 * @param {transactionGroup} transactionGroup - transactionGroup object to be inserted into the
 * array of transactionGroups.
 */
const insertTransactionGroupByTime = (transactionGroups, transactionGroup) => {
  const { primaryTransaction: { time: groupToInsertTime } = {} } = transactionGroup

  let insertIndex = transactionGroups.length

  for (let i = 0; i < transactionGroups.length; i++) {
    const txGroup = transactionGroups[i]
    const { primaryTransaction: { time } = {} } = txGroup

    if (time > groupToInsertTime) {
      insertIndex = i
      break
    }
  }

  transactionGroups.splice(insertIndex, 0, transactionGroup)
}

/**
 * @name mergeNonNonceTransactionGroups
 * @private
 * @description Inserts (mutates) transactionGroups that are not to be ordered by nonce into an array
 * of nonce-ordered transactionGroups by time. Shapeshift transactionGroups need to be sorted by time
 * within the list of transactions as they do not have nonces.
 * @param {transactionGroup[]} orderedTransactionGroups - Array of transactionGroups ordered by
 * nonce.
 * @param {transactionGroup[]} nonNonceTransactionGroups - Array of transactionGroups not intended to be ordered by nonce,
 * but intended to be ordered by timestamp
 */
const mergeNonNonceTransactionGroups = (orderedTransactionGroups, nonNonceTransactionGroups) => {
  nonNonceTransactionGroups.forEach((shapeshiftGroup) => {
    insertTransactionGroupByTime(orderedTransactionGroups, shapeshiftGroup)
  })
}

/**
 * @name nonceSortedTransactionsSelector
 * @description Returns an array of transactionGroups sorted by nonce in ascending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => {
    const unapprovedTransactionGroups = []
    const shapeshiftTransactionGroups = []
    const incomingTransactionGroups = []
    const orderedNonces = []
    const nonceToTransactionsMap = {}

    transactions.forEach((transaction) => {
      const { txParams: { nonce } = {}, status, type, time: txTime, key, transactionCategory } = transaction

      if (typeof nonce === 'undefined' || transactionCategory === 'incoming') {
        const transactionGroup = {
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried: false,
          hasCancelled: false,
        }

        if (key === 'shapeshift') {
          shapeshiftTransactionGroups.push(transactionGroup)
        } else if (transactionCategory === 'incoming') {
          incomingTransactionGroups.push(transactionGroup)
        } else {
          insertTransactionGroupByTime(unapprovedTransactionGroups, transactionGroup)
        }
      } else if (nonce in nonceToTransactionsMap) {
        const nonceProps = nonceToTransactionsMap[nonce]
        insertTransactionByTime(nonceProps.transactions, transaction)

        if (status in priorityStatusHash) {
          const { primaryTransaction: { time: primaryTxTime = 0 } = {} } = nonceProps

          if (status === CONFIRMED_STATUS || txTime > primaryTxTime) {
            nonceProps.primaryTransaction = transaction
          }
        }

        const { initialTransaction: { time: initialTxTime = 0 } = {} } = nonceProps

        // Used to display the transaction action, since we don't want to overwrite the action if
        // it was replaced with a cancel attempt transaction.
        if (txTime < initialTxTime) {
          nonceProps.initialTransaction = transaction
        }

        if (type === TRANSACTION_TYPE_RETRY) {
          nonceProps.hasRetried = true
        }

        if (type === TRANSACTION_TYPE_CANCEL) {
          nonceProps.hasCancelled = true
        }
      } else {
        nonceToTransactionsMap[nonce] = {
          nonce,
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried: transaction.type === TRANSACTION_TYPE_RETRY,
          hasCancelled: transaction.type === TRANSACTION_TYPE_CANCEL,
        }

        insertOrderedNonce(orderedNonces, nonce)
      }
    })

    const orderedTransactionGroups = orderedNonces.map((nonce) => nonceToTransactionsMap[nonce])
    mergeNonNonceTransactionGroups(orderedTransactionGroups, shapeshiftTransactionGroups)
    mergeNonNonceTransactionGroups(orderedTransactionGroups, incomingTransactionGroups)
    return unapprovedTransactionGroups.concat(orderedTransactionGroups)
  }
)

/**
 * @name nonceSortedPendingTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are still pending sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedPendingTransactionsSelector = createSelector(
  nonceSortedTransactionsSelector,
  (transactions = []) => (
    transactions.filter(({ primaryTransaction }) => primaryTransaction.status in pendingStatusHash)
  )
)

/**
 * @name nonceSortedCompletedTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are confirmed sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedCompletedTransactionsSelector = createSelector(
  nonceSortedTransactionsSelector,
  (transactions = []) => (
    transactions
      .filter(({ primaryTransaction }) => !(primaryTransaction.status in pendingStatusHash))
      .reverse()
  )
)

export const submittedPendingTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => (
    transactions.filter((transaction) => transaction.status === SUBMITTED_STATUS)
  )
)

export const getTxParams = (state, selectedTransaction = {}) => {
  const { metamask: { send } } = state
  const { txParams } = selectedTransaction
  return txParams || {
    from: send.from,
    gas: send.gasLimit || '0x5208',
    gasPrice: send.gasPrice || getFastPriceEstimateInHexWEI(state, true),
    to: send.to,
    value: getSelectedToken(state) ? '0x0' : send.amount,
  }
}
