// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const ethers = require('ethers');
const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2,
};

const logger = require("@0confirmation/logger")("@0confirmation/sol/setup");

const fromEthers = require('@0confirmation/providers/from-ethers');
const chalk = require('chalk');
const fromSecret = require('@0confirmation/providers/from-secret');
const { InfuraProvider, Web3Provider } = require('@ethersproject/providers');
const { fromV3 } = require('ethereumjs-wallet');
const mainnet = require('../private/mainnet')
const kovan = require('../private/kovan');

const wallets = {
  mainnet,
  kovan
};
const chain = process.env.CHAIN === '1' ? 'mainnet' : 'testnet';
const infuraChain = chain === 'testnet' ? 'kovan' : chain;

const ShifterPool = require('@0confirmation/sdk/shifter-pool');
const environment = require('@0confirmation/sdk/environments').getAddresses('mainnet');
const yargs = require('yargs');

(async () => {
  const wallet = fromV3(wallets[infuraChain], process.env.SECRET).getPrivateKeyString();
  const provider = new Web3Provider(fromSecret(wallet, fromEthers(new InfuraProvider(infuraChain))));
  const shifterPool = new ShifterPool(environment.shifterPool, provider);
  tx =  (
    await shifterPool.setup(
      {
        shifterRegistry: environment.shifterRegistry,
        minTimeout: chain === "test" ? "1" : "10000",
        daoFee: ethers.utils.parseEther("0.01"),
        poolFee: ethers.utils.parseEther("0.01"),
        gasEstimate: '1460000',
        maxGasPriceForRefund: ethers.utils.parseUnits('500', 9),
        maxLoan:
          chain === "mainnet"
            ? ethers.utils.parseEther("1")
            : ethers.utils.parseEther("10"),
      }, [], [], [])
    );
  
  console.log(chalk.bold('txhash: ' + tx.hash));
  await tx.wait();
  console.log(chalk.bold.cyan('mined!'));
  process.exit(0);
})().catch((err) => console.error(err));
