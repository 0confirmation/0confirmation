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

(async () => {
  const router = new UniswapV2Router01(kovan.router, provider);
  const tokenA = new ShifterERC20Mock(kovan.renbtc, provider);
  const tokenB = new MockWETH(kovan.weth, provider);
  const amountA = ethers.utils.parseUnits('0.025', 8);
  const amountB = ethers.utils.parseUnits('1', 18);
  const [ from ] = await provider.listAccounts();
  console.log('approve token A');
  await (await tokenA.approve(router.address, '0x00' + 'ff'.repeat(31))).wait();
  console.log('get token B');
  await (await tokenB.mint(from, amountB)).wait();
  console.log('approve token B');
  await (await tokenB.approve(router.address, '0x00' + 'ff'.repeat(31))).wait();
  console.log('add liquidity');
  await (await router.addLiquidity(tokenA.address, tokenB.address, amountA, amountB, amountA, amountB, from, String(Math.floor(Date.now() / 1000) + 120000))).wait();
  console.log('done');
  process.exit(0);
})().catch((err) => console.error(err));

