'use strict';

const path = require('path');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const wallet = require('./deploy/test-wallet');

module.exports = {
  contracts_directory: path.join(__dirname, 'contracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  compilers: {
    solc: {
      version: 'v0.6.3'
    }
  },
  networks: {
    kovan: {
      provider: new HDWalletProvider(wallet.substr(2), "https://kovan.infura.io/v3/2f1de898efb74331bf933d3ac469b98d"),
      network_id: '42'
    }
  }
};
