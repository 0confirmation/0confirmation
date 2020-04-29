'use strict';

const constants = require('./constants');
const utils = require('./util');

class LiquidityRequest {
  constructor({
    zero,
    borrower,
    actions,
    shifterPool,
    borrowProxyLib,
    token,
    nonce,
    amount,
    forbidLoan,
    gasRequested
  }) {
    Object.assign(this, {
      shifterPool,
      actions,
      borrowProxyLib,
      borrower,
      token,
      nonce,
      amount,
      zero,
      forbidLoan,
      gasRequested
    });
    if (this.borrower) {
      this.proxyAddress = utils.computeBorrowProxyAddress(this);
      this.depositAddress = utils.computeGatewayAddress({
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
  }
  async sign(from) {
    const signature = await this.zero.driver.sendWrapped('personal_sign', [ utils.computeLiquidityRequestHash({
      shifterPool: this.shifterPool,
      borrowProxyLib: this.borrowProxyLib,
      token: this.token,
      nonce: this.nonce,
      amount: this.amount,
      forbidLoan: this.forbidLoan,
      actions: this.actions || [],
      gasRequested: this.gasRequested
    }), from || (await this.zero.driver.sendWrapped('eth_accounts', []))[0] ]);
    return this.toParcel(signature);
  }
  toParcel(signature) {
    throw Error('LiquidityRequestParcel is not initialized');
    // noop
  }
}

module.exports = LiquidityRequest;

