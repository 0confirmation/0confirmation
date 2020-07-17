'use strict';

const fs = require('fs-extra');
const ERC20Shifted = require('../build/zBTC');
const ShifterRegistry = require('../build/ShifterRegistry');
const path = require('path');
const Shifter = require('../build/BTCShifter');
const Factory = {
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/factory.txt'), 'utf8').trim()
};

const Exchange = {
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/exchange.txt'), 'utf8').trim()
};

const abi = require('ethers/utils').defaultAbiCoder;
const {
  stripHexPrefix,
  addHexPrefix,
  encodeParameters,
  encodeFunctionCall,
  defaultTransaction,
  id,
  testDeploy
} = require('./deploy-utils');


const deployRenBackend = async (provider) => {
  const [ from, feeAccount ] = await provider.send('eth_accounts', []);
  const renbtc = await testDeploy(provider, ERC20Shifted.bytecode, [], []);
  const shifter = await testDeploy(provider, Shifter.bytecode, [ 'address', 'address', 'address', 'uint16', 'uint16', 'uint256' ], [ renbtc, feeAccount, from, '0x00', '0x00', '0x00' ]);
  const shifterRegistry = await testDeploy(provider, ShifterRegistry.bytecode, [], []);
  await provider.waitForTransaction(await provider.send('eth_sendTransaction', [ defaultTransaction({
    to: shifterRegistry,
    from,
    data: encodeFunctionCall('setShifter(address,address)', [ 'address', 'address' ], [ renbtc, shifter ])
  }) ]));
  return {
    renbtc,
    shifter,
    shifterRegistry
  };
};

const deployUniswapBackend = async (provider) => {
  const [ from ] = await provider.send('eth_accounts', []);
  const template = await testDeploy(provider, Exchange.bytecode);
  const factory = await testDeploy(provider, Factory.bytecode);
  await provider.waitForTransaction(await provider.send('eth_sendTransaction', [ defaultTransaction({
    to: factory,
    from,
    data: encodeFunctionCall('initializeFactory(address)', [ 'address' ], [ template ])
  }) ]));
  return {
    factory
  };
};

const createMarket = async (provider, factory, token) => {
  const [ from ] = await provider.send('eth_accounts', []);
  const receipt = await provider.waitForTransaction(await provider.send('eth_sendTransaction', [ defaultTransaction({
    to: factory,
    from,
    data: encodeFunctionCall('createExchange(address)', [ 'address' ], [ token ])
  }) ]));
  const { logs } = receipt;
  const exchange = addHexPrefix(logs[0].topics[2].substr(26));
  return {
    exchange
  };
};

const deployMocks = async (provider) => {
  const renDeployment = await deployRenBackend(provider);
  const uniswapDeployment = await deployUniswapBackend(provider);
  const exchangeDeployment = await createMarket(provider, uniswapDeployment.factory, renDeployment.renbtc);
  return Object.assign({}, renDeployment, uniswapDeployment, exchangeDeployment);
};

module.exports = deployMocks;
