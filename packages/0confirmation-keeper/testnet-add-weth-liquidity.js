process.env.CHAIN = '42';

const makeZero = require('./make-zero');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const MockWETH = makeManagerClass(require('@0confirmation/sol/build/MockWETH'));
const ShifterERC20Mock = makeManagerClass(require('@0confirmation/sol/build/ShifterERC20Mock'));
const UniswapV2Router01 = makeManagerClass(require('@uniswap/v2-periphery/build/UniswapV2Router01'));
const UniswapV2Pair = makeManagerClass(require('@uniswap/v2-core/build/UniswapV2Pair'));
const environments = require('@0confirmation/sdk/environments');

const kovan = environments.getAddresses('testnet');
const ethers = require('ethers');

const zero = makeZero();
const provider = zero.getProvider().asEthers();

(async () => {
  const token = new MockWETH(kovan.dai, provider);
  const pair = new UniswapV2Pair('0xFBd94720e049CC80D647Cd2d2825d527aB19c4B3', provider);
  const amount = ethers.utils.parseUnits('1789882520', 18);
  const [ from ] = await provider.listAccounts();
  await (await token.mint(from, amount)).wait();
  console.log('add liquidity');
  await (await token.transfer(pair.address, amount)).wait();
  console.log('transferred');
  await (await pair.sync()).wait();
  console.log('done');
  process.exit(0);
})().catch((err) => console.error(err));

