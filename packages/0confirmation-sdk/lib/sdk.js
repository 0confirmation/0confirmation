'use strict';

const ethersUtil = require('ethers/utils');
const utils = require('./util');
const Driver = require('./driver');
const sigUtil = require('eth-sig-util');

class Zero {
  constructor({
    backends,
    shifterPool
  }) {
    this.options = {
      shifterPool
    };
    this.driver = new Driver(backends);
  }
  async broadcastLiquidityRequest({
    from,
    token,
    amount,
    nonce,
    gasRequested
  }) {
    const signature = await (this.driver.getBackend('ethereum')).sendWrapped('personal_sign', [ ethersUtil.solidityKeccak256([
      'address',
      'bytes32',
      'uint256',
      'uint256'
    ], [
      token,
      nonce,
      amount,
      gasRequested
    ]), from ]);
    await this.driver.sendWrapped('0cf_broadcastLiquidityRequest', [{
      token,
      amount,
      nonce,
      gasRequested,
      signature
    }]);
  }
  async listenForLiquidityRequests(callback) {
    return await (this.driver.getBackend('zero'))._filterLiquidityRequests((msg) => {
      const [{
        token,
        amount,
        nonce,
        gasRequested,
        signature
      }] = msg.data.params;
      const borrower = ethersUtil.verifyMessage(ethersUtil.solidityKeccak256([
        'address',
        'bytes32',
        'uint256',
        'uint256'
      ], [
        token,
        nonce,
        amount,
        gasRequested
      ]), signature);
      const proxyAddress = utils.computeBorrowProxyAddress({
        shifterPool: this.options.shifterPool,
        borrower,
        token,
        nonce,
        amount
      });
      const depositAddress = utils.computeGatewayAddress({
        isTestnet: true,
        mpkh: proxyAddress, // replace with real mpkh, whatever this is
        g: {
          to: proxyAddress,
          p: [],
          tokenAddress: token,
          nonce
        }
      });
      callback({
        message: {
          token,
          nonce,
          amount,
          gasRequested,
          signature
        },
        depositAddress,
        proxyAddress
      });
    });
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

module.exports = Zero;
