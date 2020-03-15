'use strict';

const RenVM = require('@renproject/ren');
const RPCWrapper = require('../../util/rpc-wrapper');

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
    return await this.ren.lightnode.sendMessage(method, params);
  }
}

module.exports = RenVMBackend;
