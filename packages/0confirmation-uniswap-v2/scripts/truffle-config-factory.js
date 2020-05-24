'use strict';

const path = require('path');

module.exports = {
  contracts_directory: path.join(__dirname, '..', 'contracts', 'factory'),
  contracts_build_directory: path.join(__dirname, '..', 'build'),
  compilers: {
    solc: {
      version: 'v0.5.16',
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
