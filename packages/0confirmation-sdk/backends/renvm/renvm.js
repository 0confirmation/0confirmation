'use strict';

const { RenVM } = require('@0confirmation/renvm');
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
    this.ren = new RenVM(network);
  }
  async sendPromise({
    method,
    id,
    params
  }) {
   console.log(method);
   console.log(require('util').inspect(params, { colors: true, depth: 15 }));
   switch (method) {
     case 'ren_submitTx':
       return resultToJsonRpc(id, async () => await this.ren.renVM.submitTx(params[0].tx, 10));
     case 'ren_queryTx':
       return resultToJsonRpc(id, async () => await this.ren.renVM.queryTx(params[0].txHash, 10));
    }
  }
  send(o, cb) {
    this.sendPromise(o).then((result) => cb(null, result)).catch((err) => cb(err));
  }
}

module.exports = RenVMBackend;
