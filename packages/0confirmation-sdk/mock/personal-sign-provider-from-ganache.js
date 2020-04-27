'use strict';

const ethers = require('ethers');
const RpcEngine = require('json-rpc-engine');
const asMiddleware = require('json-rpc-engine/src/asMiddleware');

const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const personalSignProviderFromGanache = (provider) => {
  if (!provider.sendAsync) provider.sendAsync = provider.send;
  const engine = new RpcEngine();
  engine.push((req, res, next, end) => {
    if (req.method === 'personal_sign') {
      req.params[1] = ethers.utils.hexlify(ethers.utils.concat([
        ethers.utils.toUtf8Bytes('\x19Ethereum Signed Message:\n'),
        ethers.utils.toUtf8Bytes(String(ethers.utils.arrayify(req.params[1]).length)),
        ethers.utils.arrayify(req.params[1])
      ]));
      req.method = 'eth_sign';
    }
    next(null);
  });
  engine.push(providerAsMiddleware(provider));
  return providerFromEngine(engine);
};

module.exports = personalSignProviderFromGanache;
