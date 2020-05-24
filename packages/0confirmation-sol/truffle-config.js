'use strict';

const path = require('path');
const ethers = require('ethers');
const { fromV3 } = require('ethereumjs-wallet');
const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const kovanWallet = require('./deploy/kovan');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const validateHasPassword = (envVar) => {
  if (!envVar) throw Error('You must supply a password, try PASSWORD=secret yarn deploy:<network>');
  return envVar;
};


module.exports = {
  contracts_directory: path.join(__dirname, 'contracts'),
  contracts_build_directory: path.join(__dirname, 'build'),
  compilers: {
    solc: {
      version: 'v0.6.8',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  networks: {
    kovan: {
      provider: () => new HDWalletProvider(fromV3(kovanWallet, validateHasPassword(process.env.PASSWORD)).getPrivateKeyString().substr(2), fromEthers(new ethers.providers.InfuraProvider('kovan'))),
      from: '0x' + kovanWallet.address,
      gasPrice: ethers.utils.parseUnits('1', 9).toString(),
      skipDryRun: true,
      network_id: '42',
      timeoutBlocks: 1e4
    },
    ganache: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
