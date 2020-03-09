'use strict';

const { createNode } = require('./create-node');
const { RPCWrapper, resultToJsonRpc } = require('../../util');

const presets = {
  lendnet: '/dns4/lendnet.0confirmation.com/tcp/443/wss/p2p-websocket-star/'
};

const fromPresetOrMultiAddr = (multiaddr) => presets[multiaddr] || multiaddr;

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
    this.multiaddr = fromPresetOrMultiAddr(multiaddr);
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
    await this.node.initialize();
  }
  async stop() {
    await this.node.stop();
  }
  _filterLiquidityRequests(handler) {
     this.node.subscribe('/1.0.0/broadcastLiquidityRequest', handler);
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
        return await resultToJsonRpc(id, () => this.node.peerId);
      case '0cf_broadcastLiquidityRequest':
        const [ liquidityRequest ] = params;
        this.node.publish('/broadcastLiquidityRequest', {
          id,
          params: [ liquidityRequest ]
        });
        return await resultToJsonRpc(id, () => 1);
      case '0cf_filterLiquidityRequests':
        const filterId = this._nextFilterId(this);
        this._filters[filterId] = this._filters[filterId] || [];
        this._filterLiquidityRequests((msg) => {
          console.log(msg.data);
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
