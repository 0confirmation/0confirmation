module.exports = function () {
  this.on('peer:discovery', (peer) => this.handleDiscover(peer));
  this.on('peer:connect', (peer) => this.handleConnect(peer));
  this.on('peer:disconnect', (peer) => this.handleDisconnect(peer));
};
