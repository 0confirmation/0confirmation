const bb = require('bluebird')
const PeerInfo = bb.promisifyAll(require('peer-info'))
const Node = require('../Node')

const multiAddrByEnv = {
	development: (peerId) => `/dns4/meme-staging.com/tcp/62443/wss/p2p-websocket-star/p2p/${peerId}`,
	production: (peerId) => `/dns4/meme-backup.com/tcp/62443/wss/p2p-websocket-star/p2p/${peerId}`
	backup: (peerId) => `/dns4/p2p-net.meme-test.xyz/tcp/443/wss/p2p-websocket-star/p2p/${peerId}`,
};
let seen = false;

const getMulti = (env, peerId) => {
  if (env === 'mainnet') env = 'production';
  else if (env === 'testnet') env = 'backup';
  const url = (multiAddrByEnv[env] || (env && ((peerId) => (`${env}${env.match(/\/$/) ? '' : '/'}${peerId}`))) || multiAddrByEnv.production)(peerId);
  if (!seen && console.validatorLog) {
    seen = true;
    console.validatorLog('using network: ' + url);
  }
  return url;
};

module.exports = async function () {
  this.peerInfo = this.peerInfo ? await PeerInfo.createAsync(this.peerInfo) : await PeerInfo.createAsync()
  this.peerId = this.peerInfo.id.toB58String()
  const ma = getMulti(process.env.REACT_APP_MEME_ENV || process.env.BOOTNODE, this.peerId);
  this.peerInfo.multiaddrs.add(ma)
  this.node = new Node({ peerInfo: this.peerInfo }, this.options.nodeOptions.dht)
  await this.node.start()
  console.log(`started node: ${this.peerId}`)
  return this.addEventHandlers()
}
