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
    return resultToJsonRpc(id, async () => await promiseRetry(async (retry) => {
      try {
        return await this.ren.renVM.sendMessage(method, params);
      } catch (e) {
        retry(e);
      }
    }));
  }
  send(o, cb) {
    this.sendPromise(o).then((result) => cb(null, result)).catch((err) => cb(err));
  }
}

module.exports = RenVMBackend;
