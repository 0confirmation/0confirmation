'use strict';

const Zero = require('@0confirmation/sdk');
const ethers = require('ethers');
const provider = require('@0confirmation/sol/truffle-config').networks.mainnet.provider();
const zero = new Zero(provider, 'mainnet');
const environments = require('@0confirmation/sdk/environments');

const mainnet = environments.getAddresses('mainnet');

(async () => {
  const liquidityToken = await zero.getLiquidityTokenFor(mainnet.renbtc);
  const token = liquidityToken.attach(mainnet.renbtc);
/*
  //console.log(await token.balanceOf((await (zero.getProvider().asEthers()).listAccounts())[0]));
  const approve = await zero.approveLiquidityToken(mainnet.renbtc, { gasPrice: ethers.utils.parseUnits('25', 9) });
  console.log(approve.hash);
  await approve.wait();
  console.log('done with approve');
*/
  const tx = await liquidityToken.addLiquidity(String(ethers.utils.parseUnits(process.env.LIQUIDITY, 8).sub(1000)), { gasPrice: ethers.utils.parseUnits('25', 9) });
  console.log(tx.hash);
  await tx.wait();
  console.log('done');
  process.exit(0);
})().catch((err) => console.error(err));
  
