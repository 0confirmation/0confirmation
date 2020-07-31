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
const { makeManagerClass } = require('@0confirmation/eth-manager')

const UniswapV2Adapter = require('@0confirmation/sol/build/UniswapV2Adapter');

const UniswapV2AdapterManager = makeManagerClass(UniswapV2Adapter);

(async () => {
  const wallet = fromV3(mainnet, process.env.SECRET).getPrivateKeyString();
  const provider = new Web3Provider(fromPrivateKey(wallet.substr(2), fromEthers(new InfuraProvider('mainnet'))));
  const uniswapV2Adapter = new UniswapV2AdapterManager('0xf103B9c22b0A9d3c6b97A44bF98aF1ac956c9F25', provider);
  console.log(await uniswapV2Adapter.getExternalIsolateHandler());
  process.exit(0);
})().catch((err) => console.error(err));
