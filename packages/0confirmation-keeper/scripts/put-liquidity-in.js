'use strict';

const ethers = require('ethers');
const path = require('path');
const DB = require('./db');
const makeZero = require('./make-zero');
const environments = require('@0confirmation/sdk/environments');
const env = environments.getAddresses('testnet');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const ERC20 = makeManagerClass(require('@0confirmation/sol/build/DAI'));

const chalk = require('chalk');

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const zero = makeZero();
  const ethersProvider = zero.getProvider().asEthers();
  const liquidityToken = await zero.getLiquidityTokenFor(env.renbtc);
  const address = (await (zero.getProvider().asEthers()).listAccounts())[0];
  const token = new ERC20(env.renbtc, ethersProvider);
  const balanceOfToken = await token.balanceOf(address);
  const approvalLiquidityTokenTx = await zero.approveLiquidityToken(env.renbtc, { gasPrice: ethers.utils.parseUnits('30', 9) });
  console.log('approve liquidity token: ' + approvalLiquidityTokenTx.hash);
  const addLiquidityTx = await zero.addLiquidity(env.renbtc, ethers.utils.parseUnits('0.1', 8), { gasPrice: ethers.utils.parseUnits('30', 9) });
  console.log('add liquidity tx: ' + addLiquidityTx.hash);
  const approvePoolTx = await zero.approvePool(env.renbtc, { gasPrice: ethers.utils.parseUnits('30', 9) });
  console.log('approve pool tx: ' + approvePoolTx.hash);
  process.exit(0);
})().catch((err) => console.error(err));
