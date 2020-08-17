'use strict';

process.env.CHAIN = '42';
const ethers = require('ethers');
const path = require('path');
const DB = require('../db');
const makeZero = require('../make-zero');
const environments = require('@0confirmation/sdk/environments');
const env = environments.getAddresses('testnet');

const chalk = require('chalk');

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const zero = makeZero();
	/*
  zero.setEnvironment({
    shifterPool: '0x07ee1838be2c8855fe5a66ab71f7aa20ccf4948f'
  });
  */
  const liquidityToken = await zero.getLiquidityTokenFor(env.renbtc);
  const provider = zero.getProvider().asEthers();
  const [ from ] = await provider.listAccounts();
  const balance = await liquidityToken.balanceOf(from);
  const offset = await liquidityToken.offset();
  const amount = balance.sub(offset);
  console.log(balance);
  const tx = await zero.removeLiquidity(env.renbtc, amount.sub(100000), { gasPrice: ethers.utils.parseUnits('30', 9) });
  console.log(tx);
  await tx.wait();
  console.log('done');
})().catch((err) => console.error(err));
