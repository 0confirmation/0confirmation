'use strict';

var ethers = require('ethers');

var mainnet = new ethers.providers.InfuraProvider('mainnet');
var fromEthers = require('ethers-to-web3');

var Zero = require('./')

var environment = require('./environments').getAddresses('mainnet');
var zero = new Zero(fromEthers(mainnet), 'mainnet');

var liquidityToken = zero.getLiquidityTokenFor(environment.renbtc);

