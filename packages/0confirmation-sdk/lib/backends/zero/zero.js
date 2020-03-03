'use strict';

const Socket = require('./p2p/Socket');

const presets = {
  lendnet: '/dns4/lendnet.0confirmation.com/tcp/443/wss/p2p-websocket-star/'
};

const fromPresetOrMultiAddr = (multiaddr) => presets[multiaddr] || multiaddr;

class ZeroBackend {
  constructor({
    driver,
    multiaddr,
    keeperOpts,
    peerInfo = null
  }) {
    this.name = 'zero';
    this.prefixes = ['0cf'];
    this.driver = driver;
    this.socket = new Socket(peerInfo, {
      multiaddr: fromPresetOrMultiAddr[multiaddr]
    });
  }
  async initialize() {
    await this.socket.start();
  }
  send({
    id,
    method,
    params
  }) {
    switch (method) {
      case '0cf_broadcastLiquidityRequest':
        const [ liquidityRequest ] = params;
        return this.socket.publish('/broadcastLiquidityRequest', {
          id,
          params: [ liquidityRequest ]
        });
      case '0cf_filterLiquidityRequests':
        return this.socket.subscribe('/broadcastLiquidityRequest', (msg) => console.log(msg)) 
      case '0cf_filterLiquidityProvisions':
        return this.socket.subscribe('/receiveLiquidityProvision', (msg) => console.log(msg));
      case '0cf_fillLiquidityProvision':
        const [ peerId, requestId, liquidityProvision ] = params;
        this.socket.sendResponse(peerId, '/receiveLiquidityProvision', requestId, liquidityProvision);
    }
  }
}

module.exports = ZeroBackend;
