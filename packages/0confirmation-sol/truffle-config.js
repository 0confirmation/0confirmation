'use strict';

const path = require('path');
const { provider } = require('./deploy/test-provider');

module.exports = {
  contracts_directory: path.join(__dirname, 'contracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  compilers: {
    solc: {
      version: 'v0.6.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 10
        }
      }
    }
  },
  networks: {
    kovan: {
      provider,
      network_id: '42'
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    }
  }
};
