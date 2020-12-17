'use strict';

const makeZero = require('../make-zero');
const ethers = require('ethers');
const { sync: randomBytes } = require('random-bytes');
(async () => {
  const zero = makeZero();
  await zero.initializeDriver();
  const zeroConnector = zero.driver.getBackendByPrefix('0cf');
  zeroConnector.subscribe();
  console.log('waiting on keeper');
  const keeper = await new Promise((resolve) => zeroConnector.keeperEmitter.on('keeper', resolve));
  console.log('keeper:', keeper);
  const loan = zero.createLiquidityRequest({
    amount: ethers.utils.parseUnits('1', 8),
    nonce: '0x' + randomBytes(32).toString('hex'),
    token: await zero.getRenBTC(),
    gasRequested: '0',

  });
  const parcel = await loan.sign();
  await parcel.broadcast();
})().catch((err) => console.error(err));
