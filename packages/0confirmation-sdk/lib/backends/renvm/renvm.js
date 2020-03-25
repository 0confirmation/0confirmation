'use strict';

const RenVM = require('@renproject/ren').default;
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
  async send({
    method,
    id,
    params
  }) {
    return resultToJsonRpc(id, async () => await promiseRetry(async (retry) => {
      try {
        return await this.ren.renVM.network.sendMessage(method, params);
      } catch (e) {
        retry(e);
      }
    }));
  }
}

module.exports = RenVMBackend;
