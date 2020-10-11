'use strict';

const util = require('../util');
const EventEmitter = require('events').EventEmitter;

class EventEmitterAndRPCWrapper extends util.RPCWrapper {
  constructor() {
    super();
    EventEmitter.call(this);
  }
}

const getAll = (o) => {
  const retval = [];
  for (const i in o) {
    retval.push(i);
  }
  return retval;
};

getAll(EventEmitter.prototype).forEach((v) => {
  EventEmitterAndRPCWrapper.prototype[v] = EventEmitter.prototype[v];
});

class MockZeroBackend extends EventEmitterAndRPCWrapper {
  constructor() {
    super();
    this.name = 'zero';
    this.prefixes = ['0cf'];
    this.filterTargets = [];
  }
  _connectMock(otherInstance) {
    this.filterTargets.push(otherInstance);
  }
  connectMock(otherInstance) {
    this._connectMock(otherInstance);
    otherInstance._connectMock(this);
  }
  async _filterLiquidityRequests(handler) {
    this.filtering = true;
    this.filterTargets.forEach((instance) => instance.on('/1.0.0/broadcastLiquidityRequest', (evt) => handler({
      data: evt
    })));
  }
  createKeeperEmitter() {
    const ee = new EventEmitter();
    ee.subscribe = () =>  {};
    return ee;
  }
  createBTCBlockEmitter() {
    const ee = new EventEmitter();
    ee.subscribe = () =>  {};
    return ee;
  }
  async _unsubscribeLiquidityRequests() {
    this.filtering = false;
    this.filterTargets.forEach((instance) => instance.removeAllListeners());
  }
  async send({
    id,
    method,
    params
  }, cb) {
    Promise.resolve().then(async () => {
      switch (method) {
        case '0cf_peerId':
          return await util.resultToJsonRpc(id, () => this.node.socket.peerInfo.id.toB58String());
        case '0cf_setBorrowProxy':
          return await util.resultToJsonRpc(id, () => {
            return this._borrowProxy = params[0];
          });
        case '0cf_getBorrowProxy':
          return await util.resultToJsonRpc(id, async () => {
            if (!this._borrowProxy) throw Error('no borrow proxy selected');
            return this._borrowProxy;
          });
        case '0cf_broadcastLiquidityRequest':
          const [{
            shifterPool,
            token,
            amount,
            nonce,
            actions,
            forbidLoan,
            gasRequested,
            signature
          } = {}] = (params || []);
          this.emit('/1.0.0/broadcastLiquidityRequest', {
            id,
            params: [{
              shifterPool,
              token,
              amount,
              actions,
              forbidLoan,
              nonce,
              gasRequested,
              signature
            }]
          });
          return await util.resultToJsonRpc(id, () => 1);
        case '0cf_filterLiquidityRequests':
          const filterId = this._nextFilterId(this);
          this._filters[filterId] = this._filters[filterId] || [];
          this._filterLiquidityRequests((msg) => {
            this._filters[filterId] = this._filters[filterId] || [];
            this._filters[filterId].push(msg);
          });
          return await util.resultToJsonRpc(id, () => filterId);
        case '0cf_getFilterUpdates':
          const [ getFilterUpdatesId ] = params;
          const result = this._filters[getFilterUpdatesId];
          if (!result) return await util.resultToJsonRpc(id, () => []);
          this._filters[getFilterUpdatesId] = [];
          return await util.resultToJsonRpc(id, () => result);
      }
    }).then((result) => cb(null, result)).catch((err) => cb(err));
  }
}
module.exports = function makeMockZeroBackend() {
  return new MockZeroBackend();
}
