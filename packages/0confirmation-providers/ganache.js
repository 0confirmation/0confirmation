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
  engine.push((req, res, next, end) => {
    if (req.method === 'personal_sign') {
      req.params[0] = ethers.utils.hexlify(ethers.utils.concat([
        ethers.utils.toUtf8Bytes('\x19Ethereum Signed Message:\n'),
        ethers.utils.toUtf8Bytes(String(ethers.utils.arrayify(req.params[0]).length)),
        ethers.utils.arrayify(req.params[0])
      ]));
      req.method = 'eth_sign';
    }
    next();
  });
  engine.push(walletMiddleware);
  return makeBaseProvider(providerFromEngine(engine));
};

module.exports = makePersonalSignProviderFromPrivateKey;
