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
//  const wallet = fromV3(wallets[infuraChain], process.env.SECRET).getPrivateKeyString();
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, new ethers.providers.InfuraProvider('mainnet'));
  const shifterPool = new ShifterPool(environment.shifterPool, signer);
  tx =  (
    await shifterPool.setup(
      {
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
      }, [], [], [{
        liqToken: '0x2Cd31ac784B848d9D579a3940302c73788b8db0e',
        token: require('@0confirmation/sdk/environments').getAddresses('mainnet').renbtc,
        baseFee: ethers.utils.parseUnits('0.001', 8)
      }])
    );
  console.log(tx.hash);
  process.exit(0);
})().catch((err) => console.error(err));
