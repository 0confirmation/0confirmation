'use strict';

const RenVMBackend = require('./backends/renvm');
const EthereumBackend = require('./backends/ethereum');
const ZeroBackend = require('./backends/zero');
const RPCWrapper = require('./util/rpc-wrapper');
const difference = require('lodash/difference');

const builtInBackends = {
  ethereum: EthereumBackend,
  zero: ZeroBackend,
  renvm: RenVMBackend
};

class ZeroDriver {
  constructor(backends) {
    this.backends = {};
    this.prefixes = {};
    const backendNames = Object.keys(backends);
    const addons = difference(backendNames, builtInBackends);
    Object.keys(builtInBackends).forEach((v) => {
      if (backends[v]) this.registerBackend(new (builtInBackends[v])(Object.assign({
        driver: this
      }, backends[v])));
    });
/*
    addons.forEach((v) => {
      this.registerBackend(Object.assign({
        driver: this
      }, backends[v]));
    });
*/
  }
  registerBackend(backend) {
    this.backends[backend.name] = backend;
    backend.prefixes.forEach((prefix) => {
      this.prefixes[prefix] = backend;
    });
  }
  getBackend(name) {
    return new RPCWrapper(this.backends[name]);
  }
  getBackendByPrefix(prefix) {
    return this.getBackend(this.prefixes[prefix].name);
  }
  async initialize() {
    for (const backend of Object.keys(this.backends)) {
      if (this.backends[backend].initialize) await this.backends[backend].initialize();
    }
  }
  injectProvider() {
    this.ethereum.injectProvider();
  }
  async send({
    jsonrpc,
    id,
    method,
    params
  }) {
    const prefix = method.split('_')[0];
    try {
      return this.getBackendByPrefix(prefix).send({
        jsonrpc,
        id,
        method,
        params
      });
    } catch (e) {
      return {
        jsonrpc: '2.0',
        id,
        error: e
      };
    }
  }
}

module.exports = ZeroDriver;
