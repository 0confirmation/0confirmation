'use strict';

const fromSecret = require('@0confirmation/providers/from-secret');
const fromEthers = require('@0confirmation/providers/from-ethers');
const ethers = require('ethers');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'mainnet';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || "a414a8f640db48c5aa8fcc3bf29353e8";

const provider = fromSecret('0x' + process.env.PRIVATE_KEY, fromEthers(new ethers.providers.InfuraProvider(ETH_NETWORK, INFURA_PROJECT_ID)));
console.log(NETWORK);

const makeZero = () => {
  const zero = new Zero(provider, NETWORK);
  return zero;
};

module.exports = makeZero;
