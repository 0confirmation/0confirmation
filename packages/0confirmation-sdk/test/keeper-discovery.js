'use strict';

const Zero = require('../');
const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const { InfuraProvider } = require('@ethersproject/providers');

const TIMEOUT = 2500;

const randomBytes = require('random-bytes').sync;

const createRandomWalletZero = async () => {
  const zero = new Zero(fromPrivate(randomBytes(32).toString('hex'), fromEthers(new InfuraProvider('mainnet'))), 'mainnet');
  await zero.initializeDriver();
  return zero;
};

const timeout = (n) => new Promise((resolve) => setTimeout(resolve, TIMEOUT));

(async () => {
  const keeper = await createRandomWalletZero();
  await timeout();
  const client = await createRandomWalletZero();
  await timeout();
  await keeper.startHandlingKeeperDiscovery();
  await timeout();
  const keeperEmitter = client.createKeeperEmitter();
  const promise = new Promise((resolve) => {
    keeperEmitter.on('keeper', resolve);
  });
  const otherPromise = keeperEmitter.subscribe();
  await otherPromise;
  await timeout();
  console.log('subscribed');
  const transmittedKeeperAddress = await promise;
  console.log('got it!', transmittedKeeperAddress);
  
})().catch((err) => console.error(err));

