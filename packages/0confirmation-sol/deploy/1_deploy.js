// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const ShifterERC20Mock = require("../build/ShifterERC20Mock");
const DAI = require("../build/DAI");
const {BigNumber} = require("@ethersproject/bignumber");
const bigNumberify = (n) => BigNumber.from(n);
const UniswapV2Router01 = require("../build/UniswapV2Router01");
const bre = require("@nomiclabs/buidler");
const environments = require("@0confirmation/sdk/environments");
const Zero = require("@0confirmation/sdk");
const fromEthers = require("ethers-to-web3");
const {ZeroMock} = Zero;
const { fromV3 } = require('ethereumjs-wallet');
const keeper = fromV3(require('../private/keeper'), 'conf');
const {mapSeries} = require("bluebird");
const chalk = require("chalk");

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2,
};

const logger = require("@0confirmation/logger")("@0confirmation/sol/deploy");

const networks = {
  kovan: environments.getAddresses("testnet"),
  mainnet: environments.getAddresses("mainnet"),
};

const chainIdToNetwork = (network) => {
  switch (network) {
    case 1:
      return "mainnet";
    case 42:
      return "kovan";
    default:
      return "test";
  }
};

const makePush = (ary) => (v) => {
  ary.push(v);
  return v;
};

const makeWrapper = (ethers, signer) => (deployment) => {
  return new ethers.Contract(deployment.address, deployment.abi, signer);
};

/*
const alreadyDeployed = [
  'ShifterBorrowProxyFactoryLib',
  'ShifterPool',
  'ERC20Adapter',
  'V2SwapAndDrop',
  'TransferAll',
  'UniswapV2Adapter',
  'SimpleBurnLiquidationModule',
  'LiquidityToken'
]; */
const alreadyDeployed = [
	/*
  'UniswapV2Adapter',
  'V2SwapAndDrop',
  'ERC20Adapter',
  'SimpleBurnLiquidationModule',
  'DAI',
  'WETH9',
  'UniswapV2Router01',
  'UniswapV2Factory',
  */
];

const makeDeploy = (deploy, deployments, wrap, push, deployer) => async (
  contractName,
  args = [],
  libraries = {}
) => {
  logger.info("deploying " + contractName);
  const deployed = alreadyDeployed.includes(contractName) ? await deployments.get(contractName) : await deploy(contractName, {
    from: deployer,
    contractName,
    args,
    libraries,
  });
  logger.info("deployed!");
  return wrap(push(deployed));
};

module.exports = async (bre) => {
  const {getNamedAccounts, deployments} = bre;
  const {log} = deployments;
  const {ethers} = bre;
  const deployed = [];
  const push = makePush(deployed);
  const [signer] = await ethers.getSigners();
  const wrap = makeWrapper(ethers, signer);
  const {deployer} = await getNamedAccounts();
  const deploy = makeDeploy(deployments.deploy.bind(deployments), deployments, wrap, push, deployer);
  const {AddressZero: NO_SUBMODULE} = ethers.constants;
  const chain = chainIdToNetwork(Number(await bre.getChainId()));
  const shifterBorrowProxyFactoryLib = await deploy(
    "ShifterBorrowProxyFactoryLib",
    []
  );
  const shifterPool = await deploy("ShifterPool", [], {
    ShifterBorrowProxyFactoryLib: shifterBorrowProxyFactoryLib.address,
  });
  const erc20Adapter = await deploy("ERC20Adapter");
  await deploy("V2SwapAndDrop");
  await deploy("TransferAll");
  const ethersProvider = new bre.ethers.providers.Web3Provider(fromEthers(bre.ethereum));
  let weth, shifterRegistry, dai, renbtc, factory, router, from;
  switch (chain) {
    case "kovan":
      weth = await deploy("WETH9");
      dai = await deploy("DAI");
      factory = await deploy("UniswapV2Factory", [deployer]);
      router = await deploy("UniswapV2Router01", [
        factory.address,
        weth.address,
      ]);
      renbtc = {address: networks[chain].renbtc};
      shifterRegistry = {address: networks[chain].shifterRegistry};
      logger.info('creating weth/renbtc pair');
      await factory.createPair(weth.address, renbtc.address); // { gasLimit: ethers.utils.hexlify(6e6) });
      logger.info('creating weth/dai pair');
      await factory.createPair(weth.address, dai.address); //, { gasLimit: ethers.utils.hexlify(6e6) });

      break;
    case "mainnet":
      renbtc = {address: networks[chain].renbtc};
      shifterRegistry = {address: networks[chain].shifterRegistry};
      router = {address: networks[chain].router};
      factory = {address: networks[chain].factory};
      weth = {address: networks[chain].weth};
      dai = {address: networks[chain].dai};
      break;
    case "test":
      weth = await deploy("WETH9");
      dai = await deploy("DAI");
      shifterRegistry = await deploy("ShifterRegistryMock");
      renbtc = {
        address: await shifterRegistry.token(),
      };
      factory = await deploy("UniswapV2Factory", [deployer]);
      router = await deploy("UniswapV2Router01", [
        factory.address,
        weth.address,
      ]);
      await factory.createPair(weth.address, renbtc.address); // { gasLimit: ethers.utils.hexlify(6e6) });
      await factory.createPair(weth.address, dai.address); //, { gasLimit: ethers.utils.hexlify(6e6) });
      break;
  }
  const uniswapV2Adapter = await deploy("UniswapV2Adapter", [
    erc20Adapter.address,
  ]);
  const simpleBurnLiquidationModule = await deploy(
    "SimpleBurnLiquidationModule",
    [router.address, erc20Adapter.address]
  );
  const liquidityToken = await deploy("LiquidityToken", [
    weth.address,
    router.address,
    shifterPool.address,
    renbtc.address,
    "zeroBTC",
    "zeroBTC",
    8,
  ]);
  logger.info('deploying borrow proxy implementation');
  await (await shifterPool.deployBorrowProxyImplementation()).wait();
  logger.info('deploying asset forwarder implementation');
  await (await shifterPool.deployAssetForwarderImplementation()).wait();
  logger.info('doing setup');
  await (
    await shifterPool.setup(
      {
        shifterRegistry: shifterRegistry.address,
        minTimeout: chain === "test" ? "1" : "10000",
        daoFee: ethers.utils.parseEther("0.01"),
        poolFee: ethers.utils.parseEther("0.01"),
        gasEstimate: '1450000',
        maxGasPriceForRefund: ethers.utils.parseUnits('500', 9),
        maxLoan:
          chain === "mainnet"
            ? ethers.utils.parseEther("0.5")
            : ethers.utils.parseEther("10"),
      },
      ...((v) => [
        v.map((v) => ({
          moduleType: v.moduleType,
          target: v.target,
          sigs: v.sigs,
        })),
        v.map((v) => v.module),
      ])([
        {
          moduleType: ModuleTypes.BY_ADDRESS,
          target: renbtc.address,
          sigs: Zero.getSignatures(DAI.abi),
          module: {
            isPrecompiled: false,
            assetSubmodule: erc20Adapter.address,
            repaymentSubmodule: erc20Adapter.address,
            liquidationSubmodule: NO_SUBMODULE,
          },
        },
        {
          moduleType: ModuleTypes.BY_ADDRESS,
          target: router.address,
          sigs: Zero.getSignatures(UniswapV2Router01.abi),
          module: {
            isPrecompiled: false,
            assetSubmodule: uniswapV2Adapter.address,
            repaymentSubmodule: NO_SUBMODULE,
            liquidationSubmodule: simpleBurnLiquidationModule.address,
          },
        },
        {
          moduleType: ModuleTypes.BY_ADDRESS,
          target: dai.address,
          sigs: Zero.getSignatures(DAI.abi),
          module: {
            isPrecompiled: false,
            assetSubmodule: erc20Adapter.address,
            repaymentSubmodule: erc20Adapter.address,
            liquidationSubmodule: NO_SUBMODULE,
          },
        },
      ]),
      [
        {
          token: renbtc.address,
          liqToken: liquidityToken.address,
          baseFee: ethers.utils.parseUnits('0.0007', 8)
        },
      ]
    )
  ).wait();
  logger.info('done!');
  if (chain === "test") {
    await (await shifterPool.setKeeper(keeper.getAddressString(), true)).wait();
    const amountMax = bigNumberify("0x" + "f".repeat(64));
    const provider = signer.provider;
    const deployerAddress = await signer.getAddress();
    from = deployerAddress;
    await mapSeries(
      [
        [renbtc.address, 8, "3.4"],
        [dai.address, 18, "7724680"],
      ],
      async ([token, decimals, amount]) => {
        const tokenWrapped = new ethers.Contract(
          token,
          DAI.abi,
          signer
        );
        await (
          await tokenWrapped.mint(
            from,
            ethers.utils.parseUnits(amount, Number(decimals))
          )
        ).wait();
        const routerWrapped = new ethers.Contract(
          router.address,
          UniswapV2Router01.abi,
          signer
        );
        await (await tokenWrapped.approve(router.address, amountMax)).wait();
        await (
          await routerWrapped.addLiquidityETH(
            token,
            ethers.utils.parseUnits(amount, decimals),
            ethers.utils.parseUnits(amount, decimals),
            ethers.utils.parseEther("10"),
            deployerAddress,
            String(Math.floor(Date.now() / 1000) + 120000),
            {value: ethers.utils.parseEther("10")}
          )
        ).wait();
      }
    );
    const renbtcWrapped = new ethers.Contract(
      renbtc.address,
      ShifterERC20Mock.abi,
      signer
    );
    await (
      await renbtcWrapped.mint(from, ethers.utils.parseUnits("10", 8))
    ).wait();
    const zero = new ZeroMock(fromEthers(signer));
    zero.setEnvironment({
      shifterPool: shifterPool.address,
    });
    await (await zero.approveLiquidityToken(renbtc.address)).wait();
    await (
      await zero.addLiquidity(
        renbtc.address,
        ethers.utils.parseUnits("5", 8).toString()
      )
    ).wait();
    logger.info('test mocks deployed');
  }
  for (let i = 0; i < deployed.length; i++) {
    if (deployed[i].newlyDeployed)
      logger.info(
        `Contract deployed at ${deployed[i].address} using ${deployed[i].receipt.gasUsed} gas on chain ${chain}`
      );
  }
};
