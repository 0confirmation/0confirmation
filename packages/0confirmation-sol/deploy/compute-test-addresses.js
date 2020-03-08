'use strict';

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const utils = require('ethers/utils');

const computeTestAddresses = (mnemonic) => {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const hdwallet = hdkey.fromMasterSeed(seed);
  const address = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet().getAddressString();
  const renbtc = utils.getContractAddress({
    from: address,
    nonce: 0
  });
  const shifter = utils.getContractAddress({
    from: address,
    nonce: 1
  });
  const shifterRegistry = utils.getContractAddress({
    from: address,
    nonce: 2
  });
  const factory = utils.getContractAddress({
    from: address,
    nonce: 5
  });
  const exchange = utils.getContractAddress({
    from: factory,
    nonce: 1
  });
  const zeroBtc = utils.getContractAddress({
    from: address,
    nonce: 8
  });
  const shifterPool = utils.getContractAddress({
    from: address,
    nonce: 9
  });
  return {
    renbtc,
    shifter,
    shifterRegistry,
    factory,
    exchange,
    zeroBtc,
    shifterPool
  };
};
