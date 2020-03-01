'use strict';

const { Web3Provider } = require('ethers/utils/web3-provider');

module.exports = class RPCWrapper {
  constructor(provider) {
    this.provider = provider;
  }
  asWrapped() {
    return new Web3Provider(this.provider);
  }
  send(...args) {
    return this.provider.send(...args);
  }
};
