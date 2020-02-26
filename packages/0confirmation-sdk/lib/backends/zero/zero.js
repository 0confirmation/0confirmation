'use strict';

const presets = {
  lendnet: '/dns4/lendnet.0confirmation.com/tcp/443/wss/p2p-websocket-star/'
};

const fromPresetOrMultiAddr = (multiaddr) => presets[multiaddr] || multiaddr;

class ZeroBackend {
  constructor({
    driver,
    multiaddr
  }) {
    this.name = 'zero';
    this.socket = new Socket({
      multiaddr: fromPresetOrMultiAddr[multiaddr]
    });
  }
  initialize() {
    await this.socket.start();
  }
  broadcast(method, params)
}
