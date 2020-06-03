'use strict';

const ethers = require('ethers');
const path = require('path');
const DB = require('./db');
const makeZero = require('./make-zero');
const environments = require('@0confirmation/sdk/environments');
const env = environments.getAddresses('mainnet');

const chalk = require('chalk');

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const zero = makeZero();
  zero.setEnvironment(Object.assign(env, {
    shifterPool: '0xc865d59d4fbb447c45af73c9aa2300eaf1f707d4'
  }));
  const liquidityToken = await zero.getLiquidityTokenFor(env.renbtc);
  console.log(liquidityToken.address);
  const balance = await liquidityToken.balanceOf((await (zero.getProvider().asEthers()).listAccounts())[0]);
  const offset = await liquidityToken.offset();
  const amount = balance.sub(offset);
  console.log(balance);
  const tx = await zero.removeLiquidity(env.renbtc, amount, { gasPrice: ethers.utils.parseUnits('30', 9) });
  console.log(tx);
  await tx.wait();
  console.log('done');
})().catch((err) => console.error(err));
