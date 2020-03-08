'use strict';

const deploy = require('@0confirmation/sol/deploy');
const { Web3Provider } = require('ethers/providers/web3-provider');

const hookInitialize = async (provider) => {
  const ethers = new Web3Provider(provider);
  return await deploy.deployTestEnvironment(ethers);
};

module.exports = hookInitialize;
