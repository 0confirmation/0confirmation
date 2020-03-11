module.exports = function findPeer(peerId) {
  return new Promise((resolve, reject) => 
    this.peerRouting.findPeer(peerId, (err, peerInfo) => {
      if (err) reject(err);
      const peerId = peerInfo.id.toB58String();
      this.peers[peerId] = { connected: true, peerInfo };
      resolve(this.peers[peerId]);
    })
  );
};