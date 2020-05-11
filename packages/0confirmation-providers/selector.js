'use strict';

const { 
  makeEngine
} = require('./');

const makeWalletSelectorFromProvider = (provider, selection) => {
  const engine = makeEngine();
  engine.push((req, res, next, end) => {
    if (req.method === 'eth_accounts') provider.sendAsync(req, (err, response) => {
      res.result = [ response.result[selection || 0] ];
      end();
    });
    else next();
  });
  engine.push(provider.asMiddleware());
  return engine.asProvider();
};

module.exports = makeWalletSelectorFromProvider;
