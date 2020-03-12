'use strict';

const { createNode } = require('../');

describe('0confirmation p2p library', () => {
  it('should communicate between nodes', async () => { 
    const node1 = await createNode({
      multiaddr: '/dns4/lendnet.0confirmation.com/tcp/9090/ws/p2p-webrtc-star/',
      dht: true
    });
    await node1.start();
    const node2 = await createNode({
      multiaddr: '/dns4/lendnet.0confirmation.com/tcp/9090/ws/p2p-webrtc-star/',
      dht: true
    });
    await node2.start();
    await node2.subscribe('/topic', (msg) => console.log('doop'));
    await node1.waitForPeer();
    await node2.waitForPeer();
    await node1.publish('/topic', { woop: 'doop' });
    await new Promise((resolve) => setTimeout(resolve, 10000));
  });

});
