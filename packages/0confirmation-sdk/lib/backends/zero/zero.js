'use strict';

const { createNode } = require('./create-node');
const resultToJsonRpc = require('../../util');

const presets = {
  lendnet: '/dns4/lendnet.0confirmation.com/tcp/443/wss/p2p-websocket-star/'
};

const fromPresetOrMultiAddr = (multiaddr) => presets[multiaddr] || multiaddr;

class ZeroBackend {
  constructor({
    driver,
    multiaddr,
    peerInfo = null
  }) {
    this.name = 'zero';
    this.prefixes = ['0cf'];
    this.driver = driver;
    this.multiaddr = fromPresetOrMultiAddr(multiaddr);
    this.peerInfo = peerInfo;
    this.filters = {};
  }
  async initialize() {
    this.socket = await createNode({
      peerInfo: this.peerInfo,
      multiaddr: this.multiaddr
    });
  }
  _filterLiquidityRequests(handler) {
     this.socket.subscribe('/broadcastLiquidityRequest', handler);
  }
  _filterLiquidityProvisions(handler) {
     this.socket.subscribe('/receiveLiquidityProvision', handler);
  }
  _nextFilterId(o) {
    return '0x' + (o._filterId = (o._filterId !== undefined ? o._filterId : -1) + 1).toString(16);
  }
  send({
    id,
    method,
    params
  }) {
    switch (method) {
      case '0cf_peerId':
        return resultToJsonRpc(id, () => this.socket.peerId);
      case '0cf_broadcastLiquidityRequest':
        const [ liquidityRequest ] = params;
        return this.socket.publish('/broadcastLiquidityRequest', {
          id,
          params: [ liquidityRequest ]
        });
      case '0cf_filterLiquidityRequests':
        const filterId = this._nextFilterId(this);
        this._filterLiquidityRequests((msg) => {
          this._filters = this._filters || {};
          this._filters[filterId] = this._filters[filterId] || [];
        });
        return resultToJsonRpc(id, () => filterId);
      case '0cf_getFilterUpdates':
        const [ getFilterUpdatesId ] = params;
        const result = this._filters[getFilterUpdatesId];
        if (!result) return resultToJsonRpc(id, () => []);
        this._filters[getFilterUpdatesId] = [];
        return resultToJsonRpc(id, () => result);
      case '0cf_filterLiquidityProvisions':
      case '0cf_fillLiquidityProvision':
        const [ peerId, requestId, liquidityProvision ] = params;
        this.socket.sendResponse(peerId, '/receiveLiquidityProvision', requestId, liquidityProvision);
    }
  }
}

module.exports = ZeroBackend;
