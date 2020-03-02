'use strict';

const ganache = require('ganache-cli');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const provider = new Web3Provider(ganache.provider());

const fs = require('fs-extra');
const deployMocks = require('./lib/deploy-mocks');
const deployZeroBackend = require('./lib/deploy-0cf');

describe('0confirmation sdk', () => {
  it('should deploy', async () => {
    const mocks = await deployMocks(provider);
    const { shifterPool } = await deployZeroBackend(provider, mocks);
  });
});
