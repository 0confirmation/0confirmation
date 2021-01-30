'use strict';

const fromEthers = require('@0confirmation/providers/from-ethers');
const chalk = require('chalk');
const fromPrivateKey = require('@0confirmation/providers/private-key-or-seed');
const { InfuraProvider, Web3Provider } = require('@ethersproject/providers');
const { fromV3 } = require('ethereumjs-wallet');
const mainnet = require('../private/mainnet')
const testnet = require('../private/kovan');
const wallets = {
  mainnet,
  testnet
};
const chain = process.env.CHAIN === '42' ? 'testnet' : 'mainnet';
const infuraChain = chain === 'testnet' ? 'kovan' : chain;
const ShifterPool = require('@0confirmation/sdk/shifter-pool');
const environment = require('@0confirmation/sdk/environments').getAddresses(chain);
const yargs = require('yargs');

(async () => {
  const wallet = fromV3(wallets[chain], process.env.SECRET).getPrivateKeyString();
  const provider = new Web3Provider(fromPrivateKey(wallet.substr(2), fromEthers(new InfuraProvider(infuraChain)))).getSigner();
  const shifterPool = new ShifterPool(environment.shifterPool, provider);
  const tx = await shifterPool.transferOwnership('0x' + (yargs.argv.owner || 'D40edc4BaB85d2Eb618b4BA75b9dDb0F58c90C34'));
  console.log(tx.hash);
  process.exit(0);
})().catch((err) => console.error(err));
