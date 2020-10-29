'use strict';

const ShifterPool = require('./deployments/live_1/ShifterPool');
const ethWallet = require('ethereumjs-wallet');
const crypto = require('crypto');
const getWallet = () => {
  let pvt;
  try {
    pvt = ethWallet.fromV3(require('./private/mainnet'), process.env.SECRET).getPrivateKeyString();
  } catch (e) {
    pvt = '0x' + crypto.randomBytes(32).toString('hex');
  }
  return new ethers.Wallet(pvt).connect(new ethers.providers.InfuraProvider('mainnet'));
};
const ethers = require('ethers');
const signer = getWallet();
const shifterPool = new ethers.Contract(ShifterPool.address, ShifterPool.abi, signer);

Object.assign(module.exports, {
  context: {
    buidler: require('@nomiclabs/buidler'),
    shifterPool,
    signer,
    payload: require('fs').readFileSync('./parsed.txt', 'utf8')
  }
}); 
