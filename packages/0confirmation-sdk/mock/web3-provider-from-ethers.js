'use strict';

const ethers = require('ethers');
const RpcEngine = require('json-rpc-engine');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerCompat = require('./provider-compat');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const makeWeb3ProviderFromEthers = (provider) => {
  const engine = new RpcEngine();
  engine.push((req, res, next, end) => {
    provider.send(req.method, req.params).then((result) => {
      res.result = result;
      end();
    }).catch((err) => {
      res.error = err;
      end();
    });
  });
  return providerFromEngine(engine);
};

module.exports = makeWeb3ProviderFromEthers;
