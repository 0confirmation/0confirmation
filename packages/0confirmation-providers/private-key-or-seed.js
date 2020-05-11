'use strict';

const {
  makeBaseProvider,
  makeEngine
} = require('./');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ethers = require('ethers');

const makePersonalSignProviderFromPrivateKey = (pvt, provider) => {
  const engine = makeEngine();
  const wallet = new ethers.Wallet('0x' + pvt);
  const walletMiddleware = makeBaseProvider(new HDWalletProvider(pvt, provider)).asMiddleware();
  engine.push(function (req, res, next, end) {
    if (req.method === 'personal_sign') {
      res.result = wallet.signMessage(ethers.utils.arrayify(req.params[0]));
      end();
    } else next();
  });
  engine.push(walletMiddleware);
  return engine.asProvider();
};

module.exports = makePersonalSignProviderFromPrivateKey;
