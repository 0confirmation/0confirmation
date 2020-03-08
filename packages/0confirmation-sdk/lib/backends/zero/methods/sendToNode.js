const pull = require('pull-stream')
const { tryStringify } = require('../util/encoding')

module.exports = async function sendToNode(peerId, protocol, data) {
  let peer = this.peers[peerId]
  if (!peer || !peer.peerInfo) {
    await this.findPeer(peerId).then(peerInfo => {
      peer = peerInfo;
    }).catch(e => {
      throw new Error(`Could not find peer info for ${peerId}`);
    });
  }
  // if (peer.pushStream) return peer.pushStream
  return new Promise((resolve, reject) => {
    // console.log(`Dialing peer ${peerId} on ${protocol}...`)
    return this.dialProtocol(peer.peerInfo, protocol, (err, conn) => {
      if (err) return reject(err)
      pull(pull.values([tryStringify(data)]), conn)
      resolve()
    })
  })
}
