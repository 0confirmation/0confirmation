process.env.CHAIN = '42';

const makeZero = require('./make-zero');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const MockWETH = makeManagerClass(require('@0confirmation/sol/build/MockWETH'));
const ShifterERC20Mock = makeManagerClass(require('@0confirmation/sol/build/ShifterERC20Mock'));
const UniswapV2Router01 = makeManagerClass(require('@uniswap/v2-periphery/build/UniswapV2Router01'));
const UniswapV2Factory = makeManagerClass(require('@uniswap/v2-core/build/UniswapV2Factory'));
const UniswapV2Pair = makeManagerClass(require('@uniswap/v2-core/build/UniswapV2Pair'));
const environments = require('@0confirmation/sdk/environments');

const kovan = environments.getAddresses('testnet');
const ethers = require('ethers');

const zero = makeZero();
const provider = zero.getProvider().asEthers();

(async () => {
  const router = new UniswapV2Router01(kovan.router, provider);
  const tokenA = new ShifterERC20Mock(kovan.renbtc, provider);
  const tokenB = new MockWETH(kovan.weth, provider);
  const factory  = new UniswapV2Factory(kovan.factory, provider);
  const [ from ] = await provider.listAccounts();
  const pair = new UniswapV2Pair(await factory.getPair(tokenA.address, tokenB.address), provider);
  console.log(await pair.address);
//  await (await pair.approve(pair.address, '0x00' + 'ff'.repeat(31))).wait();
  await (await router.removeLiquidity(tokenA.address, tokenB.address, '1000', '0', '0', from, String(Math.floor(Date.now() / 1000) + 120000))).wait();
  console.log('done');
  process.exit(0);
})().catch((err) => console.error(err));

