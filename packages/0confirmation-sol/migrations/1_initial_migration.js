const Migrations = artifacts.require('Migrations');
const environments = require('@0confirmation/sdk/environments');
const ShifterPool = artifacts.require('ShifterPool');
const SandboxLib = artifacts.require('SandboxLib');
const UniswapAdapter = artifacts.require('UniswapAdapter');
const SimpleBurnLiquidationModule = artifacts.require('SimpleBurnLiquidationModule');
const ShifterERC20Mock = artifacts.require('ShifterERC20Mock');
const ERC20Adapter = artifacts.require('ERC20Adapter');
const LiquidityToken = artifacts.require('LiquidityToken');
const CurveAdapter = artifacts.require('CurveAdapter');
const ShifterRegistryMock = artifacts.require('ShifterRegistryMock');
const ShifterBorrowProxyFactoryLib = artifacts.require('ShifterBorrowProxyFactoryLib');
const Curvefi = artifacts.require('Curvefi');
const CurveToken = artifacts.require('CurveToken');
const DAI = artifacts.require('DAI');
const WBTC = artifacts.require('WBTC');
const Exchange = artifacts.require('Exchange');
const Factory = artifacts.require('Factory');
const ethers = require('ethers');
const fs = require('fs');

const Zero = require('@0confirmation/sdk');
const { ZeroMock } = Zero;

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};

const getAddress = (artifact, network_id) => {
  if (network_id) return artifact.networks[network_id].address;
  const highest = Math.max(...Object.keys(artifact.networks).map((v) => Number(v)));
  return artifact.networks[highest].address;
};

const NO_SUBMODULE = '0x' + Array(40).fill('0').join('');

module.exports = async function(deployer) {
  await deployer.deploy(Migrations);
  await deployer.deploy(ShifterBorrowProxyFactoryLib);
  await deployer.link(ShifterBorrowProxyFactoryLib, ShifterPool);
  await deployer.deploy(ShifterPool);
  await deployer.deploy(ERC20Adapter);
  await deployer.deploy(DAI);
  const dai = await DAI.deployed();
  let shifterRegistry, renbtc, factory, renbtcExchange, daiExchange;
  if (['ganache', 'test'].find((v) => v === deployer.network)) {
    await deployer.deploy(ShifterRegistryMock);
    shifterRegistry = await ShifterRegistryMock.deployed();
    renbtc = { address: await shifterRegistry.token() };
    await deployer.deploy(Factory);
    await deployer.deploy(Exchange);
    factory = await Factory.deployed();
    let template = await Exchange.deployed();
    await factory.initializeFactory(template.address);
    let receipt = await factory.createExchange(renbtc.address);
    renbtcExchange = {
      address: receipt.logs[0].args.exchange
    };
    receipt = await factory.createExchange(dai.address);
    daiExchange = {
      address: receipt.logs[0].args.exchange
    };
  } else {
    renbtc = { address: kovan.renbtc };
    shifterRegistry = { address: kovan.shifterRegistry };
    factory = { address: kovan.factory };
    const uniswapContract = new ethers.Contract(factory.address, Factory.abi, new ethers.providers.InfuraProvider('kovan'));
    renbtcExchange = { address: await uniswapContract.getExchange(renbtc.address) };
  } 
  await deployer.deploy(CurveToken, 'Curve.fi wBTC/renBTC', 'wBTC+renBTC', 8, 0)
  await deployer.deploy(WBTC);
  const wbtc = await WBTC.deployed();
  const curveToken = await CurveToken.deployed();
  await deployer.deploy(Curvefi, [ wbtc.address, renbtc.address ], [ wbtc.address, renbtc.address ], curveToken.address, '100', ethers.utils.parseEther('0').toString())
  const curve = await Curvefi.deployed();
  await curveToken.set_minter(curve.address);
  const shifterPool = await ShifterPool.deployed();
  await deployer.deploy(CurveAdapter, getAddress(Curvefi, deployer.network_id));
  await deployer.deploy(UniswapAdapter, factory.address);
  await deployer.deploy(SimpleBurnLiquidationModule, factory.address);
  await deployer.deploy(LiquidityToken, shifterPool.address, renbtc.address, 'zeroBTC', 'zeroBTC', 8);
  await deployer;
  const liquidityToken = await LiquidityToken.deployed();
  const uniswapAdapter = await UniswapAdapter.deployed();
  const curveAdapter = await CurveAdapter.deployed();
  const erc20Adapter = await ERC20Adapter.deployed();
  const simpleBurnLiquidationModule = await SimpleBurnLiquidationModule.deployed();
  await shifterPool.deployBorrowProxyImplementation();
  await shifterPool.setup(shifterRegistry.address, '1000', ethers.utils.parseEther('0.01'), [{
    moduleType: ModuleTypes.BY_ADDRESS,
    target: renbtc.address,
    sigs: Zero.getSignatures(DAI.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: erc20Adapter.address,
      repaymentSubmodule: erc20Adapter.address,
      liquidationSubmodule: NO_SUBMODULE
    }
  }, {
    moduleType: ModuleTypes.BY_CODEHASH,
    target: renbtcExchange.address,
    sigs: Zero.getSignatures(Exchange.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: uniswapAdapter.address,
      repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
      liquidationSubmodule: simpleBurnLiquidationModule.address
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: getAddress(Curvefi),
    sigs: Zero.getSignatures(Curvefi.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: curveAdapter.address,
      repaymentSubmodule: NO_SUBMODULE,
      liquidationSubmodule: simpleBurnLiquidationModule.address
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: (await DAI.deployed()).address,
    sigs: Zero.getSignatures(DAI.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: erc20Adapter.address,
      repaymentSubmodule: erc20Adapter.address,
      liquidationSubmodule: NO_SUBMODULE
    }
  }],
  [{
    token: renbtc.address,
    liqToken: liquidityToken.address
  }]);
  // setup uni and the liquidity pool with some liqudity
  if (deployer.network === 'test' || deployer.network === 'ganache') {
    const amount = ethers.utils.bigNumberify('0xffffffffffffffffffffffffffffffffffffffff');
    const provider = new ethers.providers.Web3Provider(dai.contract.currentProvider);
    const [ truffleAddress ] = await provider.send('eth_accounts', []);
    from = truffleAddress;
    await Promise.all([ [ renbtc.address, renbtcExchange.address ], [ dai.address, daiExchange.address ] ].map(async ([ token, exchange ]) => {
      const tokenWrapped = new ethers.Contract(token, DAI.abi, provider.getSigner());
      await (await tokenWrapped.mint(from, amount)).wait();
      const exchangeWrapped = new ethers.Contract(exchange, Exchange.abi, provider.getSigner());
      await (await tokenWrapped.approve(exchangeWrapped.address, amount)).wait();
      await (await exchangeWrapped.addLiquidity(ethers.utils.parseEther('10'), ethers.utils.parseUnits('100', 8), String(Date.now() * 2), {
        value: ethers.utils.hexlify(ethers.utils.parseEther('10')),
        gasLimit: ethers.utils.hexlify(6e6)
      })).wait();
    }));
    const renbtcWrapped = new ethers.Contract(renbtc.address, ShifterERC20Mock.abi, provider.getSigner());
    await (await renbtcWrapped.mint(from, ethers.utils.parseUnits('10', 8))).wait();
    const zero = new ZeroMock(dai.contract.currentProvider);
    zero.network.shifterPool = shifterPool.address;
    await (await zero.approveLiquidityToken(renbtc.address)).wait();
    await (await zero.addLiquidity(renbtc.address, ethers.utils.parseUnits('5', 8).toString())).wait();
  }
};
