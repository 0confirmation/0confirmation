// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const logger = require("@0confirmation/logger")(
  "@0confirmation/sol/script/install-modules"
);
const ethers = require("ethers");
const Zero = require("@0confirmation/sdk");

const {AddressZero: NO_SUBMODULE} = ethers.constants;

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2,
};
const ERC20Adapter = require("../deployments/live_1/ERC20Adapter");
const UniswapV2Adapter = require("../deployments/live_1/UniswapV2Adapter");
const SimpleBurnLiquidationModule = require("../deployments/live_1/SimpleBurnLiquidationModule");
const DAI = require("../build/DAI");
const UniswapV2Router01 = require("../build/UniswapV2Router01");
const fromEthers = require("@0confirmation/providers/from-ethers");
const chalk = require("chalk");
const fromPrivateKey = require("@0confirmation/providers/private-key-or-seed");
const {InfuraProvider, Web3Provider} = require("@ethersproject/providers");
const {fromV3} = require("ethereumjs-wallet");
const mainnet = require("../private/mainnet");
const ShifterPool = require("@0confirmation/sdk/shifter-pool");
const environment = require("@0confirmation/sdk/environments").getAddresses(
  "mainnet"
);

(async () => {
  const wallet = fromV3(mainnet, process.env.SECRET).getPrivateKeyString();
  const provider = new Web3Provider(
    fromPrivateKey(wallet.substr(2), fromEthers(new InfuraProvider("mainnet")))
  );
  const shifterPool = new ShifterPool(environment.shifterPool, provider);
  const chain = "mainnet";
  const tx = await shifterPool.setup(
    {
      shifterRegistry: environment.shifterRegistry,
      minTimeout: chain === "test" ? "1" : "10000",
      daoFee: ethers.utils.parseEther("0.001"),
      poolFee: ethers.utils.parseEther("0.001"),
      maxLoan:
        chain === "mainnet"
          ? ethers.utils.parseEther("0.1")
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
        target: environment.renbtc,
        sigs: Zero.getSignatures(DAI.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: ERC20Adapter.address,
          repaymentSubmodule: ERC20Adapter.address,
          liquidationSubmodule: NO_SUBMODULE,
        },
      },
      {
        moduleType: ModuleTypes.BY_ADDRESS,
        target: environment.router,
        sigs: Zero.getSignatures(UniswapV2Router01.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: UniswapV2Adapter.address,
          repaymentSubmodule: NO_SUBMODULE,
          liquidationSubmodule: SimpleBurnLiquidationModule.address,
        },
      },
      {
        moduleType: ModuleTypes.BY_ADDRESS,
        target: environment.dai,
        sigs: Zero.getSignatures(DAI.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: ERC20Adapter.address,
          repaymentSubmodule: ERC20Adapter.address,
          liquidationSubmodule: NO_SUBMODULE,
        },
      },
    ]),
    []
  );
  logger.info("txhash: " + tx.hash);
  await tx.wait();
  logger.info("mined!");
  process.exit(0);
})().catch((err) => console.error(err));
