'use strict';

const { createNode } = require('../');

describe('0confirmation p2p library', () => {
  it('should communicate between nodes', async () => { 
    const node1 = await createNode({
//      multiaddr: '/dns4/lendnet.0confirmation.com/tcp/9090/ws/p2p-websocket-star/',
      multiaddr: '/ip4/68.183.157.220/tcp/9090/ws/p2p-webrtc-star/',
      dht: true
    });
    await node1.start();
    const node2 = await createNode({
//      multiaddr: '/dns4/lendnet.0confirmation.com/tcp/9090/ws/p2p-websocket-star/',
      multiaddr: '/ip4/68.183.157.220/tcp/9090/ws/p2p-webrtc-star/',
      dht: false
    });
    await node2.start();
    console.log('woop');
    await node1.waitForConnect();
    await node2.waitForConnect();
    console.log('woop');
    await node1.subscribe('woop', (msg) => console.log(msg));
    await node2.publish('woop', { woop: 'doop' });
  });

});
