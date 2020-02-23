'use strict';

module.exports = {
  compilers: {
    solc: {
      version: 'stable',
      docker: true
    }
  },
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    }
  }
};
