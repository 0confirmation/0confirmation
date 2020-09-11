'use strict';

const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const ethers = require('ethers');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'mainnet';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || '2f1de898efb74331bf933d3ac469b98d';

const provider = fromPrivate(process.env.PRIVATE_KEY, fromEthers(new ethers.providers.InfuraProvider(ETH_NETWORK, INFURA_PROJECT_ID)));
console.log(NETWORK);

const makeZero = () => {
  const zero = new Zero(provider, NETWORK);
  return zero;
};

module.exports = makeZero;
