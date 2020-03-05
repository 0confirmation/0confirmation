'use strict';

const deployMocks = require('@0confirmation/sdk/test/lib/deploy-mocks');

const { Web3Provider } = require('ethers/providers/web3-provider');

const hookInitialize = async (provider) => await deployMocks(new Web3Provider(provider));

module.exports = hookInitialize;
