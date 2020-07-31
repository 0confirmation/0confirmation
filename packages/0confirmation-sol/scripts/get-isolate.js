'use strict';

const fromEthers = require('@0confirmation/providers/from-ethers');
const chalk = require('chalk');
const fromPrivateKey = require('@0confirmation/providers/private-key-or-seed');
const { InfuraProvider, Web3Provider } = require('@ethersproject/providers');
const { fromV3 } = require('ethereumjs-wallet');
const mainnet = require('../private/mainnet')
const ShifterPool = require('@0confirmation/sdk/shifter-pool');
const environment = require('@0confirmation/sdk/environments').getAddresses('mainnet');
const yargs = require('yargs');
const ShifterPoolIsolateQuery = require('@0confirmation/sol/build/ShifterPoolIsolateQuery');
const ethers = require('ethers');
const abi = ethers.utils.defaultAbiCoder;

const decodeIsolate = (v) => abi.decode(ShifterPoolIsolateQuery.abi.find((v) => v.name === 'execute').outputs, v);

(async () => {
  const wallet = fromV3(mainnet, process.env.SECRET).getPrivateKeyString();
  const provider = new Web3Provider(fromPrivateKey(wallet.substr(2), fromEthers(new InfuraProvider('mainnet'))));
  const shifterPool = new ShifterPool(environment.shifterPool, provider);
  console.log(decodeIsolate((await shifterPool.query(ShifterPoolIsolateQuery.bytecode, '0x')).data));
  process.exit(0);
})().catch((err) => console.error(err));
