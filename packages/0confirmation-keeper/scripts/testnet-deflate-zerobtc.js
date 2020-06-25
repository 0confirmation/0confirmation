process.env.CHAIN = '42';

const makeZero = require('./make-zero');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const MockWETH = makeManagerClass(require('@0confirmation/sol/build/MockWETH'));
const ShifterERC20Mock = makeManagerClass(require('@0confirmation/sol/build/ShifterERC20Mock'));
const UniswapV2Router01 = makeManagerClass(require('@uniswap/v2-periphery/build/UniswapV2Router01'));
const environments = require('@0confirmation/sdk/environments');

const kovan = environments.getAddresses('testnet');
const ethers = require('ethers');

const zero = makeZero();
const provider = zero.getProvider().asEthers();
const yargs = require('yargs');

(async () => {
  const renbtc = new MockWETH(kovan.renbtc, provider);
  const liquidityToken = await zero.getLiquidityTokenFor(renbtc.address);
  const txHash = (await renbtc.transfer(liquidityToken.address, ethers.utils.parseUnits(yargs.argv._[0], 8))).hash;
  console.log(txHash);
  await provider.waitForTransaction(txHash);
  console.log('done!');
  process.exit(0);
})().catch((err) => console.error(err));

