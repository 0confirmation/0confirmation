'use strict';

const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraUrl = 'https://kovan.infura.io/v3/2f1de898efb74331bf933d3ac469b98d';
const ethers = require('ethers');
const { promisify } = require('bluebird');

const makeKovanProvider = (privKey) => {
  const provider = new HDWalletProvider(privKey, infuraUrl);
  const { send } = provider;
  provider.send = async (o, cb) => {
    if (o.method === 'personal_sign') {
      const wallet = new ethers.Wallet('0x' + privKey);
      return cb(null, {
        jsonrpc: '2.0',
        id: o.id,
        result: wallet.signMessage(o.params[0])
      });
    }
    return send.call(provider, o, cb);
  };
  return provider;
};

const makePromisifiedKovanProvider = (privKey) => {
  const provider = makeKovanProvider(privKey);
  provider.send = promisify(provider.send, { context: provider });
  return provider;
};

module.exports = makeKovanProvider;
module.exports.promisified = makePromisifiedKovanProvider;
