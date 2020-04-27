'use strict';

const RpcEngine = require('json-rpc-engine');
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ethers = require('ethers');
const providerCompat = require('./provider-compat');

const makePersonalSignProviderFromPrivateKey = (pvt, provider) => {
  provider = providerCompat(provider);
  const engine = new RpcEngine();
  const wallet = new ethers.Wallet('0x' + pvt);
  const walletProvider = new HDWalletProvider(pvt, provider);
  engine.push(providerAsMiddleware(walletProvider));
  engine.push(function (req, res, next, end) {
    if (req.method === 'personal_sign') {
      res.result = wallet.signMessage(ethers.utils.arrayify(req.params[0]));
    }
    end();
  });
  return providerFromEngine(engine);
};

module.exports = makePersonalSignProviderFromPrivateKey;
