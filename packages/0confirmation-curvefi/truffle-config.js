'use strict';

const path = require('path');
const { from, provider } = require('@0confirmation/sol/deploy/test-provider');

module.exports = {
  contracts_directory: path.join(__dirname, 'contracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  compilers: {
    solc: {
      version: 'v0.6.5',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  networks: {
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    kovan: {
      provider,
      from,
      network_id: '42'
    }
  }
};
