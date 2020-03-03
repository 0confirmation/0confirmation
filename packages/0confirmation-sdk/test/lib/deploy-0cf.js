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
const wabi = require('web3-eth-abi');
const { encodeFunctionCall: encodeFn } = require('web3-eth-abi');
const SimpleBurnLiquidationModule = require('@0confirmation/sol/build/SimpleBurnLiquidationModule');
const UniswapAdapter = require('@0confirmation/sol/build/UniswapAdapter');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');

const deployZeroBackend = async (provider, mocks) => {
  const { exchange, factory, renbtc, shifterRegistry } = mocks;
  const [ from ] = await provider.send('eth_accounts', []);
  const simpleBurnLiquidationModule = await testDeploy(provider, SimpleBurnLiquidationModule.bytecode, ['address'], [factory]);
  const uniswapAdapter = await testDeploy(provider, UniswapAdapter.bytecode, [ 'address' ], [ factory ]);
  const sigs = abi.decode([ 'bytes4[]' ], await provider.send('eth_call', [{
    to: uniswapAdapter,
    data: encodeFunctionCall('getSignatures()', [], [])
  }]))[0];
  const zeroBtc = await testDeploy(provider, LiquidityToken.bytecode, [ 'address', 'string', 'string' ], [ renbtc, 'zeroBTC', 'zeroBTC' ])
  const shifterPool = await testDeploy(provider, ShifterPool.bytecode, [], []);
  await provider.waitForTransaction(await provider.send('eth_sendTransaction', [ defaultTransaction({
    to: shifterPool,
    from,
    data: wabi.encodeFunctionCall(ShifterPool.abi.find((v) => v.name === 'setup'), [
      shifterRegistry,
      '1000',
      [{
        target: exchange,
        sigs,
        module: {
          assetHandler: uniswapAdapter,
          liquidationModule: simpleBurnLiquidationModule
        }
      }],
      [],
      [{
        token: renbtc,
        liqToken: zeroBtc
      }]
    ])
  }) ]));
  return {
    simpleBurnLiquidationModule,
    uniswapAdapter,
    shifterPool
  };
};

module.exports = deployZeroBackend;
