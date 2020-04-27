'use strict';

const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const ethers = require('ethers');

const getMockRenBTCAddress = async (provider, contracts) => {
  const contract = new ethers.Contract(contracts.shifterRegistry, ShifterRegistryMock.abi, provider);
  return await contract.token();
};

module.exports = getMockRenBTCAddress;
