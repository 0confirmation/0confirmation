'use strict';

const ganache = require('ganache-cli');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const provider = new Web3Provider(ganache.provider());

const fs = require('fs-extra');
const deployMocks = require('./lib/deploy-mocks');

describe('0confirmation sdk', () => {
  it('should deploy', async () => {
    const deploy = await deployMocks(provider);
  });
});
