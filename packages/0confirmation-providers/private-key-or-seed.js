'use strict';

const RpcEngine = require('json-rpc-engine');
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ethers = require('ethers');
const makeBaseProvider = require('./base-provider');

const makePersonalSignProviderFromPrivateKey = (pvt, provider) => {
  const engine = makeBaseProvider(provider).asMiddleware();
  const wallet = new ethers.Wallet('0x' + pvt);
  const walletMiddleware = makeBaseProvider(new HDWalletProvider(pvt, provider)).asMiddleware();
  engine.push(function (req, res, next, end) {
    if (req.method === 'personal_sign') {
      res.result = wallet.signMessage(ethers.utils.arrayify(req.params[0]));
      end();
    } else next();
  });
  engine.push(walletMiddleware);
  return makeBaseProvider(providerFromEngine(engine));
};

module.exports = makePersonalSignProviderFromPrivateKey;
