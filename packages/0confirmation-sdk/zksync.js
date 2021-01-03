'use strict';

const Zero = require('./sdk');
const ZkSyncDeposit = require('@0confirmation/sol/deployments/live/ZkSyncDeposit');
const environment = require('./environments');

const addresses = environment.getAddresses('mainnet');

const encodeAddress = (address) =>
  ethers.utils.defaultAbiCoder.encode(
    ["bytes"],
    [
      ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [address]
      ),
    ]
  );

const createZkSyncActions = (zkSync, zkSyncDepositPreprocessor) => {
  return Zero.staticPreprocessor(zkSyncDepositPreprocessor, encodeAddress(zkSync));
};

const executeZkSyncLoan = (zero, {
  amount,
  renbtc = addresses.renbtc,
  nonce = '0x' + randomBytes(32).toString('hex'),
  zkSync = '0xaBEA9132b05A70803a4E85094fD0e1800777fBEF',
  zkSyncDepositPreprocessor = ZkSyncDeposit.address
}) => {
  return zero.createLiquidityRequest({
    amount,
    nonce,
    actions: createZkSyncActions(zkSync, zkSyncDepositPreprocessor),
    token: renbtc,
    gasRequested: '0'
  });
};

module.exports.executeZkSyncLoan = executeZkSyncLoan;
