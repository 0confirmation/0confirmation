const pull = require('pull-stream')
const { tryParse } = require('../util/encoding')

module.exports = function () {
  this.on('peer:discovery', (peer) => this.handleDiscover(peer));
  this.on('peer:connect', (peer) => this.handleConnect(peer));
  this.on('peer:disconnect', (peer) => this.handleDisconnect(peer));
  this.handle('/broadcastLiquidityRequest', (protocol, conn) => {
    pull(conn, pull.map(data => tryParse(data.toString('utf8'))), pull.drain(d => fn(d)));
  });
};
