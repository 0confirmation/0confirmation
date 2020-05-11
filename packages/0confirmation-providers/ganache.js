'use strict';

const ethers = require('ethers');
const {
  makeEngine,
  makeBaseProvider
} = require('./');

const makePersonalSignProviderFromGanache = (provider) => {
  const engine = makeEngine();
  const walletMiddleware = makeBaseProvider(provider).asMiddleware();
  engine.push((req, res, next, end) => {
    if (req.method === 'personal_sign') {
      req.params[0] = ethers.utils.hexlify(ethers.utils.concat([
        ethers.utils.toUtf8Bytes('\x19Ethereum Signed Message:\n'),
        ethers.utils.toUtf8Bytes(String(ethers.utils.arrayify(req.params[0]).length)),
        ethers.utils.arrayify(req.params[0])
      ]));
      req.method = 'eth_sign';
      console.log(req);
    }
    next();
  });
  engine.push(walletMiddleware);
  return engine.asProvider();
};

module.exports = makePersonalSignProviderFromGanache;
