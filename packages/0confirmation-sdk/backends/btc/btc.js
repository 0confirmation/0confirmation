'use strict';

const RPCWrapper = require('../../util/rpc-wrapper');
const resultToJsonRpc = require('../../util/result-to-jsonrpc');
const handler = require('send-crypto/build/main/handlers/BTC/BTCHandler');

class BTCBackend extends RPCWrapper {
  constructor(options) {
    super();
    this.testnet = options.network === 'testnet'
    this.handler = handler;
    this.name = 'btc';
    this.prefixes = [ 'btc' ];
  }
  ln(v) {
    console.log(require('util').inspect(v, { colors: true, depth: 15 }));
    return v;
  }
  async sendPromise({
    id,
    method,
    params
  }) {
    switch (method) {
      case 'btc_getUTXOs':
        return await resultToJsonRpc(id, async() => this.ln(await this.handler.getUTXOs(...this.ln([this.testnet, ...params]))));
      case 'btc_broadcastTransaction':
        return await resultToJsonRpc(id, () => this.handler._apiFallbacks.broadcastTransaction(this.testnet, ...params));
    }
  }
  send(o, cb) { 
    this.sendPromise(o).then((result) => cb(null, result)).catch((err) => cb(err));
  }
}

module.exports = BTCBackend;
