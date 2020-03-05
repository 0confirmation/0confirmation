'use strict';

const deployMocks = require('@0confirmation/sdk/test/lib/deploy-mocks');
const deployZero = require('@0confirmation/sdk/test/lib/deploy-0cf');
const chalk = require('chalk');

const { Web3Provider } = require('ethers/providers/web3-provider');

const hookInitialize = async (provider) => {
  const ethers = new Web3Provider(provider);
  const mocks = await deployMocks(ethers);
  Object.assign(mocks, await deployZero(ethers, mocks));
  console.log(chalk.bold(chalk.cyan('0cf environment initialized')));
  console.log(chalk.bold('== RenVM Shifter Registry: ') + mocks.shifterRegistry);
  console.log(chalk.bold('== RenBTC: ') + mocks.renbtc);
  console.log(chalk.bold('== RenBTC Shifter: ') + mocks.shifter);
  console.log(chalk.bold('== 0cf Shifter Pool: ') + mocks.shifterPool);
  console.log(chalk.bold('== ZeroBTC (Liquidity Token): ') + mocks.zeroBtc);
};
module.exports = hookInitialize;
