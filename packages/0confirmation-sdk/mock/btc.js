'use strict';

const util = require('../util');
const randomBytes = require('random-bytes');

const makeMockBtc = () => {
  const mock = {
    name: 'btc',
    prefixes: ['btc'],
    async send({
      method,
      params,
      id
    }) {
      return await util.resultToJsonRpc(id, () => [{
        output_no: 1,
        txid: randomBytes.sync(32).toString('hex')
      }]);
    }
  };
  mock.__proto__ = util.RPCWrapper.prototype;
  return mock;
};

module.exports = makeMockBtc;
