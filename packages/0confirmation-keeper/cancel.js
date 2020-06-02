'use strict';

const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const ethers = require('ethers');
const path = require('path');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'mainnet';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');
const LiquidityRequestParcel = require('@0confirmation/sdk/liquidity-request-parcel');
const environments = require('@0confirmation/sdk/environments');
const level = require('level');
const env = environments.getAddresses(ETH_NETWORK);
const PromiseQueue = require('promiseq');
const DB = require('./db');

const toNumber = (v) => Number(ethers.utils.bigNumberify(ethers.utils.arrayify(Buffer.from(v))));

const toBuffer = (v) => Buffer.from(ethers.utils.arrayify(ethers.utils.bigNumberify(v)));

const toAscii = (v) => ethers.utils.toUtf8String(ethers.utils.arrayify(v));

const provider = fromPrivate(process.env.PRIVATE_KEY, fromEthers(new ethers.providers.InfuraProvider(ETH_NETWORK)));

const chalk = require('chalk');

const makeZero = async () => {
  const zero = new Zero(provider, NETWORK);
  await zero.initializeDriver();
  return zero;
};

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const ethersProvider = provider.asEthers();
  const tx = await ethersProvider.send('eth_sendTransaction', [{
    to: ethers.constants.AddressZero,
    data: '0x',
    value: '0x0',
    nonce: '0x' + Number(process.env.NONCE).toString(16),
    from: (await ethersProvider.listAccounts())[0],
    gasPrice: ethers.utils.hexlify(ethers.utils.parseUnits('100', 9)),
    gas: ethers.utils.hexlify(ethers.utils.bigNumberify(21000))
  }])
  console.log('sent');
  console.log(Object.keys(tx));
  await tx.wait();
  process.exit(0);
})().catch((err) => console.error(err));
