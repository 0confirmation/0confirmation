'use strict';

const RenVMBackend = require('./backends/renvm');
const EthereumBackend = require('./backends/ethereum');
const ZeroBackend = require('./backends/zero');
const BTCBackend = require('./backends/btc');
const RPCWrapper = require('./util/rpc-wrapper');
const difference = require('lodash/difference');

const builtInBackends = {
  ethereum: EthereumBackend,
  zero: ZeroBackend,
  renvm: RenVMBackend,
  btc: BTCBackend
};

class ZeroDriver extends RPCWrapper {
  constructor(backends) {
    super();
    this.backends = {};
    this.prefixes = {};
    const backendNames = Object.keys(backends);
    const addons = difference(backendNames, Object.keys(builtInBackends));
    Object.keys(builtInBackends).forEach((v) => {
      if (backends[v]) this.registerBackend(backends[v].send && Object.assign(backends[v], {
        driver: this
      }) || new (builtInBackends[v])(Object.assign({
        driver: this
      }, backends[v])));
    });
    addons.forEach((v) => {
      this.registerBackend(Object.assign({
        driver: this
      }, backends[v]));
    });
  }
  registerBackend(backend) {
    this.backends[backend.name] = backend;
    backend.prefixes.forEach((prefix) => {
      this.prefixes[prefix] = backend;
    });
  }
  getBackend(name) {
    return this.backends[name];
  }
  getBackendByPrefix(prefix) {
    return this.getBackend(this.prefixes[prefix].name);
  }
  async initialize() {
    for (const backend of Object.keys(this.backends)) {
      if (this.backends[backend].initialize) await this.backends[backend].initialize();
    }
  }
  async stop() {
    for (const backend of Object.keys(this.backends)) {
      if (this.backends[backend].stop) await this.backends[backend].stop();
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
  }, cb) {
    console.log(method);
    const prefix = method.split('_')[0];
    new Promise((resolve, reject) => this.getBackendByPrefix(prefix).send({
      jsonrpc,
      id,
      method,
      params
    }, (err, result) => err ? reject(err) : resolve(result))).then((result) => cb(null, result)).catch((err) => cb(err));
  }
}

module.exports = ZeroDriver;
