const kovan = require('../environments/kovan');
const BorrowProxyLib = artifacts.require('BorrowProxyLib');
const ShifterPool = artifacts.require('ShifterPool');
const UniswapAdapter = artifacts.require('UniswapAdapter');
const SimpleBurnLiquidationModule = artifacts.require('SimpleBurnLiquidationModule');
const ERC20AdapterModule = artifacts.require('ERC20AdapterModule');
const LiquidityToken = artifacts.require('LiquidityToken');
const Dump = artifacts.require('Dump');
const Absorb = artifacts.require('Absorb');
const CurveAdapter = artifacts.require('CurveAdapter');
const Zero = require('@0confirmation/sdk');

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};

module.exports = async function(deployer) {
  await deployer.deploy(BorrowProxyLib);
  await deployer.link(BorrowProxyLib, ShifterPool);
  await deployer.deploy(ShifterPool);
  await deployer.deploy(CurveAdapter);
  await deployer.deploy(UniswapAdapter, kovan.factory);
  await deployer.deploy(SimpleBurnLiquidationModule, kovan.factory);
  await deployer.deploy(LiquidityToken, kovan.renbtc, 'zeroBTC', 'zeroBTC');
  await deployer.deploy(Dump);
  await deployer.deploy(Absorb);
  await deployer;
  const liquidityToken = await LiquidityToken.deployed();
  const absorb = await Absorb.deployed();
  const dump = await Dump.deployed();
  const uniswapAdapter = await UniswapAdapter.deployed();
  const shifterPool = await ShifterPool.deployed();
  const erc20AdapterModule = await ERC20AdapterModule.deployed();
  const simpleBurnLiquidationModule = await SimpleBurnLiquidationModule.deployed();
  await shifterPool.setup(kovan.shifterRegistry, '1000', ethers.utils.parseEther('0.01'), [{
    moduleType: ModuleTypes.BY_CODEHASH,
    target: kovan.renbtcExchange,
    sigs: Zero.getSignatures(Exchange.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: uniswapAdapter.address,
      repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
      liquidationSubmodule: simpleBurnLiquidationModule.address
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: kovan.renbtc,
    sigs: Zero.getSignatures(LiquidityToken.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: erc20Adapter.address,
      repaymentSubmodule: erc20Adapter.address,
      liquidationSubmodule: '0x' + Array(40).fill('0').join('')
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: kovan.dai,
    sigs: Zero.getSignatures(LiquidityToken.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: erc20Adapter.address,
      repaymentSubmodule: erc20Adapter.address,
      liquidationSubmodule: '0x' + Array(40).fill('0').join('')
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: '0x' + Array(39).fill('0').join('') + '1',
    sigs: Zero.getSignatures(Absorb.abi),
    module: {
      isPrecompiled: true,
      assetSubmodule: absorb.address,
      repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
      liquidationSubmodule: simpleBurnLiquidationModule.address
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: absorb.address,
    sigs: Zero.getSignatures(Absorb.abi),
    module: {
      isPrecompiled: true,
      assetSubmodule: absorb.address,
      repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
      liquidationSubmodule: simpleBurnLiquidationModule.address
    }
  }],
  [{
    token: kovan.renbtc
    liqToken: liquidityToken.address
  }]);
};
