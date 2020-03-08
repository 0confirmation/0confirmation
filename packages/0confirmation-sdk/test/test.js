'use strict';

const ganache = require('@0confirmation/ganache');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const provider = ganache.provider();
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
  });
});
