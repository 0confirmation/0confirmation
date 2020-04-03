'use strict';

const path = require('path');
const { provider } = require('./deploy/test-provider');

module.exports = {
  contracts_directory: path.join(__dirname, 'contracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  compilers: {
    solc: {
      version: 'v0.6.3',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1500
        }
      }
    }
  },
  networks: {
    kovan: {
      provider,
      network_id: '42'
    }
  }
};
