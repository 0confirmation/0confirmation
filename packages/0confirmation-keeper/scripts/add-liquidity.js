'use strict';

const Zero = require('@0confirmation/sdk');
const ethers = require('ethers');
const zero = require('../make-zero')();
const chain = process.env.CHAIN === '42' ? 'testnet' : 'mainnet';
const environments = require('@0confirmation/sdk/environments');

const mainnet = environments.getAddresses(chain);

(async () => {
  const liquidityToken = await zero.getLiquidityTokenFor(mainnet.renbtc);
  const approve = await zero.approveLiquidityToken(mainnet.renbtc, { gasPrice: ethers.utils.parseUnits('25', 9) });
  console.log(approve.hash);
  await approve.wait();
  console.log('done with approve');
  const tx = await liquidityToken.addLiquidity(String(ethers.utils.parseUnits(process.env.LIQUIDITY, 8).sub(1000)), { gasPrice: ethers.utils.parseUnits('25', 9) });
  console.log(tx.hash);
  await tx.wait();
  console.log('done');
  process.exit(0);
})().catch((err) => console.error(err));
  
