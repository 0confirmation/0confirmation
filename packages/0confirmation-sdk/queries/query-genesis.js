'use strict';

const ethers = require('ethers');
const GenesisQuery = require('@0confirmation/sol/build/GenesisQuery');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');

const genesisQuery = async (shifterPool) => {
  const result = await shifterPool.query(GenesisQuery.bytecode, '0x');
  if (!result.success) throw Error('could not query shifter pool, is your provider on a supported network?');
  return ethers.utils.hexlify(ethers.utils.defaultAbiCoder.decode(GenesisQuery.abi.find((v) => v.name === 'execute').outputs, result.data)[0]);
};
module.exports = genesisQuery;
