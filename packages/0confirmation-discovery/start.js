'use strict';

const ZeroDriver = require('@0confirmation/sdk/lib/driver');
const driver = new ZeroDriver({
  zero: {
    multiaddr: process.env.BOOTNODE || 'lendnet',
    dht: true
  }
});

(async () => {
  await driver.initialize();
})().catch((err) => console.error(err));

