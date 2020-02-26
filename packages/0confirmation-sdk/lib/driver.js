'use strict';

const EthereumBackend = require('./backends/ethereum');
const ZeroBackend = require('./backends/zero');
const Socket = require('./p2p/Socket');
const difference = require('lodash/difference');

const builtInBackends = {
  ethereum: EthereumBackend,
  zero: ZeroBackend,
  renvm: RenVMBackend
};

class ZeroDriver {
  constructor({
    backends
  }) {
    this.backends = {};
    const backendNames = Object.keys(backendNames);
    const addons = difference(backends, builtInBackends);
    Object.keys(builtInBackends).forEach((v) => {
      if (backends[v]) this.registerBackend(new (builtInBackends[v])(Object.assign({
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
    return this.backends[backend.name] = backend;
  }
  getBackend(name) {
    return this.backends[name];
  }
  async initialize() {
    for (const backend of Object.keys(this.backend)) {
      if (this.backends[backend].initialize) await this.backends[backend].initialize();
    }
  }
  getProvider() {
    return this.ethereum.getProvider();
  },
  injectProvider() {
    this.ethereum.injectProvider();
  }
}
