// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const logger = require("@0confirmation/logger")(
  "@0confirmation/sol/script/install-modules"
);
const ethers = require("ethers");
const Zero = require("@0confirmation/sdk");

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
const ShifterPool = require("@0confirmation/sol/deployments/live/ShifterPool");
const environment = require("@0confirmation/sdk/environments").getAddresses(
  "mainnet"
);
const NO_SUBMODULE = ethers.constants.AddressZero;

const USDC_ADDRESS = ethers.utils.getAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

const ShifterPoolProdAbi = ShifterPool.abi.slice();

const record = ShifterPoolProdAbi.find((v) => v.name === 'setup');

record.inputs.find((v) => v.name === 'params');
const setupParamsAbi = record.inputs[0];
/*
const i = setupParamsAbi.components.findIndex((v) => v.name === 'keeperFee');
setupParamsAbi.components.splice(i, 1);
*/

(async () => {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.providers.InfuraProvider('mainnet'));
  console.log(wallet.address);
  const shifterPool = new ethers.Contract(ShifterPool.address, ShifterPool.abi, wallet);
  const chain = "mainnet";
  const tx = await shifterPool.setup({
    shifterRegistry: environment.shifterRegistry,
    minTimeout: chain === "test" ? "1" : "10000",
    daoFee: ethers.utils.parseEther("0.001"),
    poolFee: ethers.utils.parseEther("0.001"),
    gasEstimate: '1460000',
    maxGasPriceForRefund: ethers.utils.parseUnits('500', 9),
    maxLoan:
      chain === "mainnet"
        ? ethers.utils.parseEther("1")
        : ethers.utils.parseEther("10"),
  }, ...((v) => [
      v.map((v) => ({
        moduleType: v.moduleType,
        target: v.target,
        sigs: v.sigs,
      })),
      v.map((v) => v.module),
    ])([
      {
        moduleType: ModuleTypes.BY_ADDRESS,
        target: USDC_ADDRESS,
        sigs: Zero.getSignatures(DAI.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: ERC20Adapter.address,
          repaymentSubmodule: ERC20Adapter.address,
          liquidationSubmodule: NO_SUBMODULE,
        }
      }
    ]), [], { gasPrice: ethers.utils.parseUnits('70', 9), gasLimit: 1.5e6 });
  console.log(tx.hash);
  process.exit(0);
})().catch((err) => console.error(err));
