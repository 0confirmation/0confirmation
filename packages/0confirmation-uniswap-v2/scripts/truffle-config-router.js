'use strict';

const path = require('path');

module.exports = {
  contracts_directory: path.join(__dirname, '..', 'contracts', 'router'),
  contracts_build_directory: path.join(__dirname, '..', 'build'),
  compilers: {
    solc: {
      version: 'v0.6.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  networks: {}
};
