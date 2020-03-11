'use strict';

const { createNode } = require('@0confirmation/p2p');
const peerId = require('peer-id');
const PeerInfo = require('peer-info');
const { Buffer } = require('safe-buffer');

(async () => {
  const peerInfo = await PeerInfo.create(require('./key.json'));
  const node = await createNode({
    peerInfo,
    multiaddr: process.env.BOOTNODE || '/ip4/68.183.157.220/tcp/9090/ws/p2p-webrtc-star/',
    dht: true
  });
  await node.start();
  console.log('bootstrapped peer onto network');
})().catch((err) => console.error(err));

