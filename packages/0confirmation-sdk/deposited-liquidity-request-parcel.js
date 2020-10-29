'use strict';

const RenJS = require('./renvm');
const LiquidityRequestParcel = require('./liquidity-request-parcel');
const ethers = require('ethers');
const { BigNumber } = require('@ethersproject/bignumber');
const constants = require('./constants');
const utils = require('./util');
const { fromBase64, timeout, toHex } = utils;
const addHexPrefix = (s) => s.substr(0, 2) === '0x' ? s : '0x' + s;

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
    this.zero.driver.getBackendByPrefix('ren')._amount = BigNumber.from(this.amount).toString();
    while (true) {
      const result = await this.queryTx();
      if (result && result.tx && result.tx.out) {
        const {
          tx: {
            autogen,
            out: [{
              value: r
            }, {
              value: s
            }, {
              value: v
            }]
          }
        } = result;
        return {
          amount: autogen.find((v) => v.name === 'amount').value,
          signature: ethers.utils.joinSignature({
            v: Number(v) + 27,
            r: toHex(fromBase64(r)),
            s: toHex(fromBase64(s))
          })
        };
      } else await timeout(constants.DARKNODE_QUERY_TX_INTERVAL);
    }
  }
  async executeShiftFallback(actions = []) {
    const {
      signature: darknodeSignature,
      amount: darknodeAmount
    }  = await this.waitForSignature();
    return this.zero.shifterPool.executeShiftSansBorrow({
      liquidityRequestParcel: {
        signature: this.signature,
        gasRequested: this.gasRequested,
        request: {
          borrower: this.borrower,
          token: this.token,
          nonce: this.nonce,
          amount: this.amount,
          forbidLoan: this.forbidLoan,
          actions: (this.actions || []).map((v) => ({
            txData: v.txData || v.calldata,
            to: v.to
          }))
        }
      },
      shiftParameters: {
        txhash: addHexPrefix(this.utxo.txhash || this.utxo.txHash),
        vout: this.utxo.vout || this.utxo.vOut,
        pHash: constants.CONST_PHASH,
        amount: darknodeAmount,
        darknodeSignature
      },
      actions: actions.map((v) => ({
        txData: v.txData || v.calldata,
        to: v.to
      }))
    });
  }
  computeShiftInTxHash() {
    return utils.computeShiftInTxHash({
      renContract: RenJS.Tokens.BTC.Mint,
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
  utxo = utxo || {};
  return new DepositedLiquidityRequestParcel(Object.assign({}, this, {
    utxo: {
      txHash: utxo.txHash || '0x' + utxo.txid,
      vOut: utxo.vOut
    }
  }));
};

module.exports = DepositedLiquidityRequestParcel;
