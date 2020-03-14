'use strict';

const RPCWrapper = require('../../util/rpc-wrapper');
const Client = require('bitcoin-core');
const handler = require('send-crypto/build/main/handlers/BTC/BTCHandler');

class BTCBackend extends RPCWrapper {
  constructor(options) {
    this.testnet = options.network === 'testnet'
    this.handler = handler;
    this.name = 'btc';
    this.prefixes = [ 'btc' ];
  }
  async send({
    id,
    method,
    params
  }) {
    switch (method) {
      case 'btc_getUTXOs':
        return await resultToJsonRpc(id, () => this.handler.getUTXOs(this.testnet, ...params));
      case 'btc_broadcastTransaction':
        return await resultToJsonRpc(id, () => this.handler._apiFallbacks.broadcastTransaction(this.testnet, ...params));
    }
  }
}
