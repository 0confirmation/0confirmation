'use strict';

var ethers = require('ethers');

var mainnet = new ethers.Wallet('0x' + require('crypto').randomBytes(32).toString('hex')).connect(new ethers.providers.InfuraProvider('mainnet'));
var fromEthers = require('ethers-to-web3');

var Zero = require('./')

var environment = require('./environments').getAddresses('mainnet');
var zero = new Zero(mainnet, 'mainnet');

//var liquidityToken = zero.getLiquidityTokenFor(environment.renbtc);

