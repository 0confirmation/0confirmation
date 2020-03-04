'use strict';

const RenVM = require('@renproject/ren');

class RenVMBackend {
  constructor({ 
    driver,
    network = 'testnet'
  }) {
    this.name = 'renvm';
    this.prefixes = ['ren'];
    this.ren = new RenVM(network);
  }
  async send({
    method,
    id,
    params
  }) {
    switch (method) {
      case 'ren_queryTx':
        return this.ren.queryTx(...params);
    }
  }
}

module.exports = RenVMBackend;
