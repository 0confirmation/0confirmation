'use strict';

const fs = require('fs-extra');
const ERC20Shifted = require('../build/zBTC');
const ShifterRegistry = require('../build/ShifterRegistry');
const Shifter = require('../build/BTCShifter');
const { soliditySha3: id } = require('web3-utils');
const emasm = require('emasm');
const makeConstructor = require('emasm/macros/make-constructor');

const wrapConstructor = (bytecode) => emasm(makeConstructor(['bytes:runtime-contract-code', [ bytecode ] ]));

const Factory = {
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/factory.txt'), 'utf8')
};

const Exchange = {
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/exchange.txt'), 'utf8')
};

const abi = require('ethers/utils').defaultAbiCoder;
const stripHexPrefix = (s) => s.substr(0, 2) === '0x' ? s.substr(2) : s;
const addHexPrefix = (s) => '0x' + stripHexPrefix(s);

const encodeParameters = (types, params) => stripHexPrefix(abi.encode(types, params));

const ln = (v) => ((console.log(v)), v);
const encodeFunctionCall = (sig, types, inputs) => addHexPrefix(id(sig).substr(0, 10)) + encodeParameters(types, inputs);

const defaultTransaction = (o) => Object.assign({
  gasPrice: '0x1',
  gas: '0x' + (6e6).toString(16)
}, o);

const testDeploy = async (provider, binary, types, params) => {
  const [ from ] = await provider.send('eth_accounts', []);
  const receipt = await provider.waitForTransaction(await provider.send('eth_sendTransaction', [ defaultTransaction({
    from,
    data: addHexPrefix(binary + encodeParameters(types, params))
  }) ]));
  return receipt.contractAddress.toLowerCase();
};

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
  const template = await testDeploy(provider, Exchange.bytecode, [], []);
  const factory = await testDeploy(provider, Factory.bytecode, [], []);
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
  const exchange = logs[0].topics[2];
  return {
    exchange
  };
};

const deployMocks = async (provider) => {
  const renDeployment = await deployRenBackend(provider);
  const uniswapDeployment = await deployUniswapBackend(provider);
  const exchangeDeployment = await createMarket(provider, uniswapDeployment.factory, renDeploymennt.renbtc);
  return Object.assign({}, renDeployment, uniswapDeployment, exchangeDeployment);
};

module.exports = deployMocks;
