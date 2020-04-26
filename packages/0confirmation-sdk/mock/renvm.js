'use strict';

const util = require('../util');
const randomBytes = require('random-bytes');

const mockRenVMBackend = {
  name: 'renvm',
  prefixes: ['ren'],
  async send({
    method,
    params,
    id
  }, cb) {
    return Promise.resolve().then(() => {
      if (method === 'ren_submitTx') return util.resultToJsonRpc(id, () => ({}));
      else if (method === 'ren_queryTx') return util.resultToJsonRpc(id, () => ({
        tx: {
          out: [{
            value: '0x' + randomBytes.sync(32).toString('hex')
          }, {
            value: '0x' + randomBytes.sync(32).toString('hex')
          }, {
            value: 27
          }]
        }
      }));
    }).then((result) => cb(null, result || {})).catch((err) => cb(err));
  }
};

mockRenVMBackend.__proto__ = util.RPCWrapper.prototype;

const makeMockRenVMBackend = () => mockRenVMBackend;

module.exports = makeMockRenVMBackend;
