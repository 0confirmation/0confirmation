'use strict';

const { RenVM } = require('@0confirmation/renvm');
const LiquidityRequestParcel = require('./liquidity-request-parcel');
const ethers = require('ethers');
const constants = require('./constants');
const utils = require('./util');
const { timeout, toHex } = utils;

class DepositedLiquidityRequestParcel extends LiquidityRequestParcel {
  constructor({
    zero,
    shifterPool,
    borrowProxyLib,
    borrowProxyCreationCode,
    token,
    nonce,
    amount,
    gasRequested,
    actions,
    borrower,
    proxyAddress,
    depositAddress,
    forbidLoan,
    signature,
    utxo
  }) {
    super({
      zero,
      actions,
      shifterPool,
      borrowProxyLib,
      borrowProxyCreationCode,
      token,
      nonce,
      amount,
      gasRequested,
      borrower,
      proxyAddress,
      depositAddress,
      forbidLoan,
      signature
    });
    this.utxo = utxo;
  }
  async queryTx() {
    return await this.zero.driver.sendWrapped('ren_queryTx', {
      txHash: this.computeShiftInTxHash()
    });
  }
  async waitForSignature() {
    while (true) {
      const result = await this.queryTx();
      if (result && result.tx && result.tx.out) {
        const {
          tx: {
            out: [{
              value: r
            }, {
              value: s
            }, {
              value: v
            }]
          }
        } = result;
        return ethers.utils.joinSignature({
          v: Number(v) + 27,
          r: toHex(r),
          s: toHex(s)
        });
      } else await timeout(constants.DARKNODE_QUERY_TX_INTERVAL);
    }
  }
  computeShiftInTxHash() {
    return utils.computeShiftInTxHash({
      renContract: RenVM.Tokens.BTC.Mint,
      g: {
        to: this.proxyAddress,
        p: constants.CONST_PHASH,
        tokenAddress: this.token,
        nonce: this.nonce
      },
      utxo: this.utxo
    });
  }
  async submitToRenVM() {
    return await this.zero.submitToRenVM({
      token: this.token,
      amount: this.amount,
      nonce: this.nonce,
      to: this.proxyAddress,
      utxo: this.utxo
    });
  }
}

LiquidityRequestParcel.prototype.toDeposit = function (utxo) {
  console.log(utxo);
  utxo = utxo || {};
  return new DepositedLiquidityRequestParcel(Object.assign({}, this, {
    utxo: {
      txHash: utxo.txHash || '0x' + utxo.txid,
      vOut: utxo.vOut
    }
  }));
};

module.exports = DepositedLiquidityRequestParcel;
