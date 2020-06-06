'use strict';

const ethers = require('ethers');
const addHexPrefix = (s) => s.substr(0, 2) === '0x' ? s : '0x' + s;
const { defaultAbiCoder: abi } = ethers.utils;
const { makeManagerClass } = require('./manager');
const { safeViewExecutorMixin } = require('./mixins');
const LiquidityRequestParcel = require('./liquidity-request-parcel');
const constants = require('./constants');
const { timeout } = require('./util');
const Exports = require('@0confirmation/sol/build/Exports');
const ShifterBorrowProxy = require('@0confirmation/sol/build/ShifterBorrowProxy');
const pendingTransfersQuery = require('./queries/query-pending-transfers');
const ProxyRecordABI = Exports.abi.find((v) => v.name === 'ProxyRecordExport').inputs[0];
const TriggerParcelABI = Exports.abi.find((v) => v.name === 'TriggerParcelExport').inputs[0];

const decodeProxyRecord = (input) => abi.decode([ ProxyRecordABI ], input)[0];
const encodeTriggerParcel = (input) => abi.encode([ TriggerParcelABI ], [ input ]);

class BorrowProxy extends makeManagerClass(ShifterBorrowProxy) {
  constructor ({
    zero,
    transactionHash,
    shifterPool,
    borrowProxyLib,
    borrowProxyCreationCode,
    decodedRecord,
    user,
    utxo,
    proxyAddress,
    record
  }) {
    super(proxyAddress, zero.getProvider().asEthers().getSigner());
    this.transactionHash = transactionHash;
    this.zero = zero;
    this.shifterPool = shifterPool; 
    this.borrowProxyLib = borrowProxyLib;
    this.borrowProxyCreationCode = borrowProxyCreationCode;
    this.borrower = user;
    this.proxyAddress = proxyAddress;
    this.utxo = utxo;
    this.record = record;
    this.decodedRecord = decodedRecord || decodeProxyRecord(record);
    Object.assign(this, this.decodedRecord.request);
  }
  async getTransaction() {
    return await (this.zero.getProvider().asEthers()).send('eth_getTransactionByHash', [ this.transactionHash ]);
  }
  async getTransactionReceipt() {
    return await (this.zero.getProvider().asEthers()).send('eth_getTransactionReceipt', [ this.transactionHash ]);
  }
  async queryTransfers(fromBlock) {
    if (!fromBlock) fromBlock = await this.zero.shifterPool.getGenesis();
    return pendingTransfersQuery(this, fromBlock);
  }
  getLiquidityRequestParcel() {
    return new LiquidityRequestParcel(this);
  }
  getDepositAddress() {
    return this.getLiquidityRequestParcel().depositAddress;
  }
  async waitForConfirmed() {
    const deposited = await (this.getLiquidityRequestParcel()).waitForDeposit();
    return await deposited.waitForSignature();
  }
  async repayLoan(overrides) {
    const parcel = this.getLiquidityRequestParcel();
    const deposited = this.utxo ? parcel.toDeposit(this.utxo) : await parcel.waitForDeposit();
    const darknodeSignature = await deposited.waitForSignature();
    const record = this.decodedRecord;
    return await super.repayLoan(encodeTriggerParcel({
      record,
      shiftParameters: {
        pHash: constants.CONST_PHASH,
        vout: deposited.utxo.vOut,
        txhash: addHexPrefix(deposited.utxo.txHash),
        darknodeSignature
      }
    }), overrides || {});
  }
  async defaultLoan(overrides) {
    return await super.defaultLoan(this.record, overrides || {});
  }
  async waitForConfirmations(num = 6) {
    let utxos;
    while (true) {
      utxos = await (this.zero.driver.sendWrapped('btc_getUTXOs', [{
        confirmations: num,
        address: this.getDepositAddress()
      }]));
      if (utxos.length === 0) await timeout(constants.UTXO_POLL_INTERVAL);
      else break;
    }
    const utxo = utxos[0];
    return {
      vOut: utxo.output_no,
      txHash: '0x' + utxo.txid
    };
  }
}

safeViewExecutorMixin(BorrowProxy);

module.exports = BorrowProxy;
