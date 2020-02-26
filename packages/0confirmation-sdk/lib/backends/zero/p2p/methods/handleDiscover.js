module.exports = function handleDiscover(peer) {
  const peerId = peer.id.toB58String()
  if (this.peers[peerId]) return
  this.peers[peerId] = { connecting: true, peerInfo: peer }
  this.emit('discover', peerId)
  this.node.dial(peer, () => {})
}