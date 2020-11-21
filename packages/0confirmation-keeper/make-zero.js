'use strict';

const fromSecret = require('@0confirmation/providers/private-key-or-seed');
const ethersToWeb3 = require('ethers-to-web3');
const fromEthers = require('ethers-to-web3');
const ethers = require('ethers');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'buidler';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');
const environment = require('@0confirmation/sdk/environments').getAddresses(NETWORK);

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || '2f1de898efb74331bf933d3ac469b98d';

const PRIVATE_KEY = process.env.PRIVATE_KEY.substr(2);

const provider = NETWORK === 'buidler' ? new ethers.providers.JsonRpcProvider('http://localhost:8545') : new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_PROJECT_ID);
const signer = NETWORK === 'buidler' ? Object.assign(new ethers.providers.Web3Provider(fromSecret(PRIVATE_KEY, ethersToWeb3(provider))).getSigner(), { startWatching() {}, on() {} }) : new ethers.Wallet(PRIVATE_KEY).connect(provider);
const gasnow = require('ethers-gasnow');
const { RedispatchSigner } = require('ethers-redispatch-signer');
signer.provider.getGasPrice = gasnow.createGetGasPrice('rapid');
const shifterRegistry = new ethers.Contract(ethers.constants.AddressZero, [ 'function token() view returns (address)' ], signer.provider);

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
