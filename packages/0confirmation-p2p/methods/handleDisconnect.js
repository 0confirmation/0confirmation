module.exports = function handleDisconnect(peer) {
  const peerId = peer.id.toB58String()
  this.peers[peerId] = null
  this.emit('disconnect', peerId)
}