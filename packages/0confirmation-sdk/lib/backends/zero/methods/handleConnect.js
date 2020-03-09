module.exports = function handleConnect(peer) {
  const peerId = peer.id.toB58String()
  this.peers[peerId] = { connected: true, peerInfo: peer }
  this.emit('connect', peerId)
}
