'use strict';

const ganache = require('ganache-cli');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const provider = ganache.provider({
  gasLimit: '0x' + (1000000000).toString(16)
});
const ethers = new Web3Provider(provider);
const ZeroDriver = require('../lib/driver');

const fs = require('fs-extra');
const deployMocks = require('./lib/deploy-mocks');
const deployZeroBackend = require('./lib/deploy-0cf');

describe('0confirmation sdk', () => {
  it('should deploy', async () => {
    await deployMocks(ethers);
  });
  it('should perform a workflow', async () => {
    const driver = new ZeroDriver({
      backends: {
        ethereum: {
          provider
        },
        zero: {
          multiaddr: 'lendnet'
        },
        renvm: {
          network: 'testnet'
        }
      }
    });
    await driver.initialize();
  });
});
