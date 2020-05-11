'use strict';

const {
  makeEngine
} = require('./');

const fromEthers = (ethersProvider) => {
  const engine = makeEngine();
  engine.push(async (req, res, next, end) => {
    try {
      res.result = await ethersProvider.send(req.method, req.params);
    } catch (e) {
      res.error = e;
    }
    end();
  });
  return Object.assign(engine.asProvider(), {
    _ethers: ethersProvider
  });
};

module.exports = fromEthers;
