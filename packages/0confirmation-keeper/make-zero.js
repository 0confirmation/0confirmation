'use strict';

const fromSecret = require('@0confirmation/providers/from-secret');
const fromEthers = require('ethers-to-web3');
const ethers = require('ethers');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'mainnet';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || '2f1de898efb74331bf933d3ac469b98d';

const signer = new ethers.Wallet(process.env.PRIVATE_KEY).connect(new ethers.providers.InfuraProvider(ETH_NETWORK, INFURA_PROJECT_ID));
const gasnow = require('ethers-gasnow');
const { RedispatchSigner } = require('ethers-redispatch-signer');
signer.provider.getGasPrice = gasnow.createGetGasPrice('rapid');
console.log(NETWORK);

const makeZero = () => {
  const redispatchSigner = new RedispatchSigner(signer);
  redispatchSigner.startWatching();
  const nonces = {};
  redispatchSigner.on('tx:dispatch', (tx) => {
    if (nonces[Number(tx.nonce)]) {
      console.logKeeper('tx redispatch: ' + tx.hash + '(' + ethers.utils.formatUnits(tx.gasPrice, 9) ' gwei)');
    }
    nonces[Number(tx.nonce)] = true;
  });
  const zero = new Zero(redispatchSigner, NETWORK);
  return zero;
};

module.exports = makeZero;
