'use strict';

const makeZero = require('./make-zero');
const environments = require('@0confirmation/sdk/environments');
const kovan = environments.getAddresses('testnet');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const ERC20 = makeManagerClass(require('@0confirmation/sol/build/DAI'));
const ethers = require('ethers');
(async () => {
  const zero = makeZero();
  const ethersProvider = zero.getProvider().asEthers();
  const [ from ] = await ethersProvider.listAccounts();
  const liquidityToken = await zero.getLiquidityTokenFor(kovan.renbtc);
  const renbtc = new ERC20(kovan.renbtc, ethersProvider)
  console.log(ethers.utils.formatUnits(await renbtc.balanceOf(liquidityToken.address), 8));;
  console.log(ethers.utils.formatUnits(await renbtc.balanceOf(from), 8));
  process.exit(0);
})().catch((err) => console.error(err));
