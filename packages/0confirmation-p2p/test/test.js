'use strict';

const { createNode } = require('../');

describe('0confirmation p2p library', () => {
  it('should communicate between nodes', async () => { 
    const node1 = await createNode({
      multiaddr: '/dns4/lendnet.0confirmation.com/tcp/9090/ws/p2p-websocket-star/',
      dht: true
    });
    await node1.start();
    const node2 = await createNode({
      multiaddr: '/dns4/lendnet.0confirmation.com/tcp/9090/ws/p2p-websocket-star/',
      dht: true
    });
    await node2.start();
    console.log('started');
    await node1.waitForConnect();
    await node2.waitForConnect();
  });
});
