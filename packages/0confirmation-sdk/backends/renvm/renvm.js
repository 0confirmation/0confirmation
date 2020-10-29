'use strict';

const { RenJS } = require('@renproject/ren');;
const RPCWrapper = require('../../util/rpc-wrapper');
const promiseRetry = require('promise-retry');
const resultToJsonRpc = require('../../util/result-to-jsonrpc');

class RenVMBackend extends RPCWrapper {
  constructor({ 
    driver,
    network = 'testnet'
  }) {
    super();
    this.name = 'renvm';
    this.prefixes = ['ren'];
    this.ren = new RenJS(network);
  }
  async sendPromise({
    method,
    id,
    params
  }) {
   switch (method) {
     case 'ren_submitTx':
       return resultToJsonRpc(id, async () => await this.ren.renVM.submitTx(params.tx, 10));
     case 'ren_queryTx':
       return resultToJsonRpc(id, async () => await this.ren.renVM.queryTx(params.txHash, 10));
    }
  }
  send(o, cb) {
    this.sendPromise(o).then((result) => cb(null, result)).catch((err) => cb(err));
  }
}

module.exports = RenVMBackend;
