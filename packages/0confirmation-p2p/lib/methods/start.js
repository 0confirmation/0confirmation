const bb = require('bluebird')
const PeerInfo = bb.promisifyAll(require('peer-info'))
const Node = require('../Node')
const toMulti = (multiaddrBase, peerId) => `${multiAddrBase}${multiaddrBase.match(/\/$/) ? '' : '/'}${peerId}`;

module.exports = async function () {
  this.peerInfo = this.peerInfo ? await PeerInfo.createAsync(this.peerInfo) : await PeerInfo.createAsync()
  this.peerId = this.peerInfo.id.toB58String()
  this.peerInfo.multiaddrs.add(toMulti(this.options.multiaddr, this.peerId));
  this.node = new Node({ peerInfo: this.peerInfo }, this.options.nodeOptions.dht)
  await this.node.start()
  return this.addEventHandlers()
};
