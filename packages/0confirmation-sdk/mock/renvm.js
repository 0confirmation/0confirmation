'use strict';

const util = require('../util');
const { toBase64 } = util;
const randomBytes = require('random-bytes');
const constants = require('../constants');

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
          autogen: [
            {
              name: 'phash',
              type: 'b32',
              value: toBase64(constants.CONST_PHASH)
            },
            {
              name: 'ghash',
              type: 'b32',
              value: randomBytes.sync(32).toString('base64')
            },
            {
              name: 'nhash',
              type: 'b32',
              value: randomBytes.sync(32).toString('base64')
            },
            { name: 'amount', type: 'u256', value: this._amount },
            {
              name: 'utxo',
              type: 'ext_btcCompatUTXO',
              value: {
                amount: '40000',
                ghash: 'i9CmhYg+uYDAsC0S7sV06CP2+gKzn+GiqRv3NAPZ9Sw=',
                scriptPubKey: 'qRRt2wGy+w/K5n8kVVy/BFP6lJRhDYc=',
                txHash: '5AN0Tn3b0dfmMPNRDKFkozehQlDP+cYvZgTdY0EXlcE=',
                vOut: '1'
              }
            },
            {
              name: 'sighash',
              type: 'b32',
              value: randomBytes.sync(32).toString('base64')
            }
          ],
          out: [{
            value: randomBytes.sync(32).toString('base64')
          }, {
            value: randomBytes.sync(32).toString('base64')
          }, {
            value: 0
          }]
        }
      }));
    }).then((result) => cb(null, result || {})).catch((err) => cb(err));
  }
};

mockRenVMBackend.__proto__ = util.RPCWrapper.prototype;

const makeMockRenVMBackend = () => mockRenVMBackend;

module.exports = makeMockRenVMBackend;
