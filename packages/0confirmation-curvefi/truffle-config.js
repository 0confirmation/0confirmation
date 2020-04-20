const path = require('path');

module.exports = {
  contracts_directory: path.join(, 'contracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  networks: {
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    }
  },
  compilers: {
    solc: {
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  }
};
