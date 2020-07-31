'use strict';

const fromEthers = require('@0confirmation/providers/from-ethers');
const chalk = require('chalk');
const fromPrivateKey = require('@0confirmation/providers/private-key-or-seed');
const { InfuraProvider, Web3Provider } = require('@ethersproject/providers');
const { fromV3 } = require('ethereumjs-wallet');
const mainnet = require('../private/mainnet')
const ShifterPool = require('@0confirmation/sdk/shifter-pool');
const environment = require('@0confirmation/sdk/environments').getAddresses('mainnet');
const yargs = require('yargs');

(async () => {
  const wallet = fromV3(mainnet, process.env.SECRET).getPrivateKeyString();
  const provider = new Web3Provider(fromPrivateKey(wallet.substr(2), fromEthers(new InfuraProvider('mainnet'))));
  const shifterPool = new ShifterPool(environment.shifterPool, provider);
  const tx = await shifterPool.deployBorrowProxyImplementation();
  console.log(chalk.bold('txhash: ' + tx.hash));
  await tx.wait();
  console.log(chalk.bold.cyan('mined!'));
  process.exit(0);
})().catch((err) => console.error(err));
