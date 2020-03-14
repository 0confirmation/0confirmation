'use strict';

const HDWalletProvider = require('@truffle/hdwallet-provider');
const privKey = 'a6e0d86b30d7dec75f04650a7eb2b116aa9155ae97f78075b27bcc46f74577c9';
const infuraUrl = 'https://kovan.infura.io/v3/2f1de898efb74331bf933d3ac469b98d';
const provider = new HDWalletProvider(privKey, infuraUrl);

Object.assign(module.exports, {
  privKey,
  infuraUrl,
  provider
});
