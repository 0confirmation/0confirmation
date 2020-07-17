'use strict';

const deployZeroBackend = require('./deploy-0cf');
const deployMocks = require('./deploy-mocks');
const computeTestAddresses = require('./compute-test-addresses');

const deployTestEnvironment = async (provider) => {
  const mocks = await deployMocks(provider);
  return Object.assign(mocks, await deployZeroBackend(provider, mocks));
};

Object.assign(module.exports, {
  deployTestEnvironment,
  deployMocks,
  deployZeroBackend,
  computeTestAddresses
});
