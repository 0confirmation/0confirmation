'use strict';
const yargs = require('yargs');

const Zero = require('@0confirmation/sdk');
const ethWallet = require('ethereumjs-wallet');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config(path.join(__dirname, '..'));

const pvt = ethWallet.fromV3(require('../private/mainnet'), process.env.SECRET).getPrivateKeyString();

const ethers = require('ethers');

const signer = new ethers.Wallet(pvt).connect(new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_PROJECT_ID));

const zero = new Zero(signer, 'mainnet');
const environment = require('@0confirmation/sdk/environments').getAddresses('mainnet');
const gasnow = require('ethers-gasnow');
gasnow.mixinGetGasPrice(ethers.providers.BaseProvider.prototype);

(async () => {
  const liquidityToken = await zero.getLiquidityTokenFor(environment.renbtc);
  const tx = await liquidityToken.addLiquidity(ethers.utils.parseUnits(yargs.argv.amount, 8));
  console.log(tx.hash);
})().catch(console.error);
