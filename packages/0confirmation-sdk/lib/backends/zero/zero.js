'use strict';

const { createNode } = require('@0confirmation/p2p');
const { RPCWrapper, resultToJsonRpc } = require('../../util');

class ZeroBackend extends RPCWrapper {
  constructor({
    driver,
    multiaddr,
    dht,
    peerInfo = null
  }) {
    super();
    this.name = 'zero';
    this.prefixes = ['0cf'];
    this.driver = driver;
    this.multiaddr = multiaddr;
    this.peerInfo = peerInfo;
    this.dht = dht;
    this._filters = {};
  }
  async initialize() {
    this.node = await createNode({
      peerInfo: this.peerInfo,
      dht: this.dht,
      multiaddr: this.multiaddr
    });
    await this.node.start();
  }
  async stop() {
    await this.node.stop();
  }
  async _filterLiquidityRequests(handler) {
     return await this.node.subscribe('/1.0.0/broadcastLiquidityRequest', handler);
  }
  async _unsubscribeLiquidityRequests() {
     return await this.node.unsubscribe('/1.0.0/broadcastLiquidityRequest');
  }
  _nextFilterId(o) {
    return '0x' + (o._filterId = (o._filterId !== undefined ? o._filterId : -1) + 1).toString(16);
  }
  async send({
    id,
    method,
    params
  }) {
    switch (method) {
      case '0cf_peerId':
        return await resultToJsonRpc(id, () => this.node.socket.peerInfo.id.toB58String());
      case '0cf_setBorrowProxy':
        return await resultToJsonRpc(id, () => {
          return this._borrowProxy = params[0];
        });
      case '0cf_getBorrowProxy':
        return await resultToJsonRpc(id, async () => {
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
          gasRequested,
          signature
        } = {}] = (params || []);
        await this.node.publish('/1.0.0/broadcastLiquidityRequest', {
          id,
          params: [{
            shifterPool,
            token,
            amount,
            actions,
            nonce,
            gasRequested,
            signature
          }]
        });
        return await resultToJsonRpc(id, () => 1);
      case '0cf_filterLiquidityRequests':
        const filterId = this._nextFilterId(this);
        this._filters[filterId] = this._filters[filterId] || [];
        this._filterLiquidityRequests((msg) => {
          this._filters[filterId] = this._filters[filterId] || [];
          this._filters[filterId].push(msg);
        });
        return await resultToJsonRpc(id, () => filterId);
      case '0cf_getFilterUpdates':
        const [ getFilterUpdatesId ] = params;
        const result = this._filters[getFilterUpdatesId];
        if (!result) return await resultToJsonRpc(id, () => []);
        this._filters[getFilterUpdatesId] = [];
        return await resultToJsonRpc(id, () => result);
    }
  }
}

module.exports = ZeroBackend;
