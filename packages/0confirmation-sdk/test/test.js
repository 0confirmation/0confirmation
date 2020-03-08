'use strict';

const ganache = require('@0confirmation/ganache');
const computeTestAddresses = require('@0confirmation/sol/deploy/compute-test-addresses');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const bip39 = require('bip39');
const mnemonic = bip39.generateMnemonic();
const provider = ganache.provider({
  mnemonic
});
const mocks = computeTestAddresses(mnemonic);
const ethers = new Web3Provider(provider);

const ZeroDriver = require('../lib/driver');

const fs = require('fs-extra');

describe('0confirmation sdk', () => {
  it('should perform a workflow', async () => {
    const driver = new ZeroDriver({
      ethereum: {
        provider: ethers
      },
      zero: {
        multiaddr: 'lendnet'
      },
      renvm: {
        network: 'testnet'
      }
    });
    await driver.initialize();
    await driver.stop();
  });
});
