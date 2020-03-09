const pull = require('pull-stream')
const { tryParse } = require('../util/encoding')

const ln = (v) => ((console.log(v)), v);
module.exports = function () {
  this.on('peer:discovery', (peer) => this.handleDiscover(ln(peer)));
  this.on('peer:connect', (peer) => this.handleConnect(ln(peer)));
  this.on('peer:disconnect', (peer) => this.handleDisconnect(ln(peer)));
  this.handle('/broadcastLiquidityRequest', (protocol, conn) => {
    pull(conn, pull.map(data => tryParse(data.toString('utf8'))), pull.drain(d => fn(d)));
  });
};
