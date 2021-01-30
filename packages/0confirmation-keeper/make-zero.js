'use strict';

<<<<<<< HEAD
const fromSecret = require('@0confirmation/providers/from-secret');
const fromEthers = require('@0confirmation/providers/from-ethers');
=======
const fromSecret = require('@0confirmation/providers/private-key-or-seed');
const ethersToWeb3 = require('ethers-to-web3');
const fromEthers = require('ethers-to-web3');
>>>>>>> 52ef0ab112f9e4165b5792910ec7d0a809a9f6e9
const ethers = require('ethers');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'buidler';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');
const environment = require('@0confirmation/sdk/environments').getAddresses(NETWORK);

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || "a414a8f640db48c5aa8fcc3bf29353e8";

<<<<<<< HEAD
const provider = fromSecret('0x' + process.env.PRIVATE_KEY, fromEthers(new ethers.providers.InfuraProvider(ETH_NETWORK, INFURA_PROJECT_ID)));
console.log(NETWORK);
=======
const PRIVATE_KEY = process.env.PRIVATE_KEY.substr(2);

const provider = NETWORK === 'buidler' ? new ethers.providers.JsonRpcProvider('http://localhost:8545') : new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_PROJECT_ID);
const signer = NETWORK === 'buidler' ? Object.assign(new ethers.providers.Web3Provider(fromSecret(PRIVATE_KEY, ethersToWeb3(provider))).getSigner(), { startWatching() {}, on() {} }) : new ethers.Wallet('0x' + PRIVATE_KEY).connect(provider);
const gasnow = require('ethers-gasnow');
const { RedispatchSigner } = require('ethers-redispatch-signer');
signer.provider.getGasPrice = gasnow.createGetGasPrice('rapid');
const shifterRegistry = new ethers.Contract(ethers.constants.AddressZero, [ 'function token() view returns (address)' ], signer.provider);
>>>>>>> 52ef0ab112f9e4165b5792910ec7d0a809a9f6e9

const makeZero = () => {
  const redispatchSigner = signer;
/*  redispatchSigner.startWatching();
  const nonces = {};
  redispatchSigner.on('tx:dispatch', (tx) => {
    if (nonces[Number(tx.nonce)]) {
      console.logKeeper('tx redispatch: ' + tx.hash + '(' + ethers.utils.formatUnits(tx.gasPrice, 9) + ' gwei)');
    }
    nonces[Number(tx.nonce)] = true;
  });
  */
  const zero = new Zero(redispatchSigner, NETWORK);
  let _renbtc;
  if (NETWORK === 'buidler') {
    zero.getRenBTC = async function () {
      if (_renbtc) return _renbtc;
      const ShifterRegistryMock = require('@0confirmation/sol/deployments/local/ShifterRegistryMock');
      return (_renbtc = await shifterRegistry.attach(ShifterRegistryMock.address).token());
  };
 } else {
    zero.getRenBTC = async function () {
      return environment.renbtc;
    };
  }
  return zero;
};

module.exports = makeZero;
