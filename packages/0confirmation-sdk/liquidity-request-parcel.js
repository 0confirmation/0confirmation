'use strict';

const LiquidityRequest = require('./liquidity-request');
const utils = require('./util');
const { Buffer } = require('safe-buffer');
const ethers = require('ethers');
const { timeout } = utils;
const constants = require('./constants');

class LiquidityRequestParcel extends LiquidityRequest {
  constructor({
    zero,
    actions,
    borrowProxyLib,
    borrowProxyCreationCode,
    shifterPool,
    token,
    nonce,
    amount,
    gasRequested,
    borrower,
    forbidLoan,
    proxyAddress,
    depositAddress,
    signature
  }) {
    super({
      zero,
      actions,
      shifterPool,
      borrowProxyCreationCode,
      borrowProxyLib,
      token,
      nonce,
      amount,
      forbidLoan,
      gasRequested
    });
    this.signature = this.signature || signature;
    this.borrower = borrower || ethers.utils.verifyMessage(Buffer.from(utils.computeLiquidityRequestHash(this).substr(2), 'hex'), this.signature);
    this.proxyAddress = proxyAddress || utils.computeBorrowProxyAddress(this);
    this.depositAddress = depositAddress || utils.computeGatewayAddress({
      isTestnet: this.zero.network.isTestnet,
      mpkh: this.zero.network.mpkh,
      g: {
        to: this.proxyAddress,
        p: constants.CONST_PHASH,
        tokenAddress: this.token,
        nonce: this.nonce
      }
    });
  }
  async getBorrowProxy() {
    const proxies = await this.zero.getBorrowProxies(this.borrower);
    return proxies[proxies.length - 1] || null;
  }
  getBroadcastMessage() {
    return {
      shifterPool: this.shifterPool,
      token: this.token,
      actions: this.actions,
      nonce: this.nonce,
      amount: this.amount,
      forbidLoan: this.forbidLoan || false,
      gasRequested: this.gasRequested,
      signature: this.signature
    };
  }
  async broadcast() {
    return await this.zero.driver.sendWrapped('0cf_broadcastLiquidityRequest', [ this.getBroadcastMessage() ]);
  }
  async executeBorrow(bond, timeoutExpiry, overrides) {
    return await this.zero.executeBorrow(this, bond, timeoutExpiry, overrides || {});
  }
  toDeposited(utxo) {
    throw Error('DepositedLiquidityRequestParcel is not initialized');
    // stub
  }
  async waitForDeposit(confirmations = 0) {
    let utxos;
    while (true) {
      utxos = await (this.zero.driver.sendWrapped('btc_getUTXOs', [{
        confirmations,
        address: this.depositAddress
      }]));
      if (utxos.length === 0) await timeout(UTXO_POLL_INTERVAL);
      else break;
    }
    return this.toDeposit(utxos[0]);
  }
}

LiquidityRequest.prototype.toParcel = function (signature) {
  return new LiquidityRequestParcel(Object.assign({
    signature
  }, this));
};

module.exports = LiquidityRequestParcel;
