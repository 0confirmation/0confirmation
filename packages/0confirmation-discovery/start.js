'use strict';

const ZeroDriver = require('@0confirmation/sdk/lib/driver');
const driver = new ZeroDriver({
  zero: {
    multiaddr: process.env.BOOTNODE || 'lendnet',
    dht: false
  }
});

(async () => {
  console.log('bootstrapped peer onto network');
  await driver.initialize();
})().catch((err) => console.error(err));

