'use strict';

const ethersUtil = require('ethers/utils');
const Driver = require('./driver');
const sigUtil = require('eth-sig-util');

class Zero {
  constructor({
    backends,
    ...options
  }) {
    this.options = options;
    this.driver = new Driver(backends);
  }
  async broadcastLiquidityRequest({
    from,
    token,
    amount,
    nonce,
    gasRequested
  }) {
/*    const signature = await this.driver.getBackend('ethereum').sendWrapped('personal_sign', [ ethersUtil.solidityKeccak256([
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
*/
    const signature = ethersUtil.solidityKeccak256([
      'address',
      'bytes32',
      'uint256',
      'uint256'
    ], [
      token,
      nonce,
      amount,
      gasRequested
    ]);
    await this.driver.sendWrapped('0cf_broadcastLiquidityRequest', [{
      token,
      amount,
      nonce,
      gasRequested,
      signature
    }]);
  }
  async listenForLiquidityRequests(callback) {
    return await (this.driver.getBackend('zero'))._filterLiquidityRequests((msg) => callback(msg));
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

module.exports = Zero;
