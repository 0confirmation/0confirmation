module.exports = function getPeerInfo(peerId) {
  const peer = this.peers[peerId]
  return peer && peer.peerInfo
}