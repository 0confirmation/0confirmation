'use strict';

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
const SimpleLiquidationModule = require('@0confirmation/sol/build/SimpleLiquidationModule');
const UniswapAdapter = require('@0confirmation/sol/build/UniswapAdapter');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');

const deployZeroBackend = async (provider, mocks) => {
  const { factory } = mocks;
  const [ from ] = await provider.send('eth_accounts', []);
  const simpleLiquidationModule = await testDeploy(provider, SimpleLiquidationModule.bytecode, ['address'], ['factory']);
  const uniswapAdapter = await testDeploy(provider, UniswapAdapter.bytecode, [ 'address' ], [ factory ]);
  const sigs = abi.decode([ 'bytes4[]' ], await provider.send('eth_call', [{
    to: uniswapAdapter,
    data: encodeFunctionCall('getSignatures()', [], [])
  }]))[0];
  const shifterPool = await testDeploy(provider, ShifterPool.bytecode, ['uint256', 'address', {
    name: 'modulesByCode',
    type: 'tuple[]',
    internalType: 'struct BorrowProxyLib.ModuleRegistration[]',
    components: [{
      name: 'target',
      type: 'address',
      internalType: 'address'
    }, {
      name: 'sigs',
      type: 'bytes4[]',
      internalType: 'bytes4[]'
    }, {
      name: 'module',
      type: 'tuple',
      internalType: 'struct BorrowProxyLib.Module',
      components: [{
        name: 'assetHandler',
        type: 'address',
        internalType: 'address'
      }, {
        name: 'liquidationModule',
        type: 'address',
        internalType: 'address'
      }]
    }]
  }, {
    name: 'modulesByAddress',
    type: 'tuple[]',
    internalType: 'struct BorrowProxyLib.ModuleRegistration[]',
    components: [{
      name: 'target',
      type: 'address',
      internalType: 'address'
    }, {
      name: 'sigs',
      type: 'bytes4[]',
      internalType: 'bytes4[]'
    }, {
      name: 'module',
      type: 'tuple',
      internalType: 'struct BorrowProxyLib.Module',
      components: [{
        name: 'assetHandler',
        type: 'address',
        internalType: 'address'
      }, {
        name: 'liquidationModule',
        type: 'address',
        internalType: 'address'
      }]
    }]
  }], '1000', shifterRegistry, [{
    target: exchange,
    sigs,
    module: {
      assetHandler: uniswapAdapter,
      liquidationModule: simpleLiquidationModule
    }
  }], []);
  return {
    simpleLiquidationModule,
    uniswapAdapter,
    shifterPool
  };
};

module.exports = deployZeroBackend;
