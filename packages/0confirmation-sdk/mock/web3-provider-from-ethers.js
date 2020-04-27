'use strict';

const ethers = require('ethers');
const RpcEngine = require('json-rpc-engine');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const makeWeb3ProviderFromEthers = (provider) => {
  const engine = new RpcEngine();
  engine.push(async (req, res, next, end) => {
    try {
      res.result = await provider.send(req.method, req.params);
    } catch (e) {
      res.error = e;
    }
    end();
  });
  engine.push(providerAsMiddleware(provider));
  return providerFromEngine(engine);
};

module.exports = makeWeb3ProviderFromEthers;
