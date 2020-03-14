const BorrowProxyLib = artifacts.require('BorrowProxyLib');
const ShifterPool = artifacts.require('ShifterPool');
const UniswapAdapter = artifacts.require('UniswapAdapter');
const SimpleBurnLiquidationModule = artifacts.require('SimpleBurnLiquidationModule');
const LiquidityToken = artifacts.require('LiquidityToken');

const addresses = require('../deploy/kovan-addresses');

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};

module.exports = async function(deployer) {
  await deployer.deploy(BorrowProxyLib);
  await deployer.link(BorrowProxyLib, ShifterPool);
  await deployer.deploy(ShifterPool);
  await deployer.deploy(UniswapAdapter, addresses.factory.toLowerCase());
  await deployer.deploy(SimpleBurnLiquidationModule, addresses.factory.toLowerCase(), addresses.renbtc.toLowerCase());
  await deployer.deploy(LiquidityToken, addresses.renbtc.toLowerCase(), 'zeroBTC', 'zeroBTC');
  const liquidityTokenAddress = LiquidityToken.address;
  const uniswapAdapterAddress = UniswapAdapter.address;
  const shifterPool = await ShifterPool.deployed();
  const simpleBurnAddress = SimpleBurnLiquidationModule.address;
  await shifterPool.setup(addresses.shifterRegistry.toLowerCase(), '1000', [{
    moduleType: ModuleTypes.BY_CODEHASH,
    target: addresses.template,
    sigs: [
      '0x89f2a871',
      '0xfd11c223',
      '0x95e3c50b',
      '0x013efd8b',
      '0xcd7724c3',
      '0x59e94862',
      '0x95b68fe7',
      '0x2640f62c',
      '0x9d76ea58',
      '0x422f1043',
      '0xf88bf15a',
      '0xf39b5b9b',
      '0xad65d76d',
      '0x6b1d4db7',
      '0x0b573638',
      '0x7237e031',
      '0xd4e4841d',
      '0xddf7e1a7',
      '0xf552d91b',
      '0xb040d545',
      '0xf3c0efe9',
      '0xb1cb43bf',
      '0xec384a3e',
      '0xea650c7d',
      '0x981a1327'
    ],
    module: {
      assetHandler: uniswapAdapterAddress,
      liquidationModule: simpleBurnAddress
    }
  }],
  [{
    token: addresses.renbtc,
    liqToken: liquidityTokenAddress
  }]);
};
