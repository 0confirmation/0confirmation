'use strict';

const ethers = require('ethers');
const ShifterERC20Mock = require('@0confirmation/sol/build/ShifterERC20Mock');
const AssetForwarder = require('@0confirmation/sol/build/AssetForwarder');
const ShifterPool = require('../shifter-pool');
const PendingTransfersQuery = require('@0confirmation/sol/build/PendingTransfersQuery');
const tokenInterface = new ethers.utils.Interface(ShifterERC20Mock.abi);
const token = new ethers.Contract(ethers.constants.AddressZero, ShifterERC20Mock.abi, ethers.getDefaultProvider());

const makeTokenFilter = (from, to, fromBlock) => {
  const filter = Object.assign({}, token.filters.Transfer(from || null, to || null), {
    fromBlock: '0x' + (Number(String(fromBlock)) - 1).toString(16)
  });
  delete filter.address;
  return filter;
};

const getParsedTransfer = async (provider, ...args) => {
  const log = (await provider.getLogs(makeTokenFilter(...args)))[0];
  try {
    if (!log) return null;
    return Object.assign({}, stripNumericKeys(tokenInterface.parseLog(log)), log);
  } catch (e) {
    return null;
  }
};

const stripNumericKeys = (o) => {
  return o;
};

const pendingTransfersQuery = async (borrowProxy, fromBlock) => {
  const { shifterPool } = borrowProxy.zero;
  const provider = shifterPool.contract.provider;
  const log = ((await provider.getLogs(Object.assign({}, shifterPool.contract.filters.BorrowProxyMade(null, borrowProxy.contract.address), {
    fromBlock: fromBlock || '0x0',
    toBlock: 'latest',
    address: shifterPool.contract.address
  }))).map((v) => Object.assign({}, ShifterPool.interface.parseLog(v), v)))[0] || { values: {} };
  const result = await borrowProxy.query(PendingTransfersQuery.bytecode, '0x');
  if (!result.success) throw Error('borrow proxy query failed: ' + result.data);
  const pendingTransfers = ethers.utils.defaultAbiCoder.decode(PendingTransfersQuery.abi.find((v) => v.name === 'execute').outputs, result.data)[0].map((v) => Object.assign({}, v)).map((v) => stripNumericKeys(v));
  for (const { transfer, i } of pendingTransfers.map((transfer, i) => ({ transfer, i }))) {
    transfer.escrowAddress = ethers.utils.getCreate2Address({
      initCode: ethers.utils.arrayify(AssetForwarder.bytecode),
      salt: ethers.utils.arrayify(ethers.utils.solidityKeccak256([ 'uint256' ], [ i ])),
      from: borrowProxy.contract.address
    });
    transfer.sendEvent = await getParsedTransfer(provider, borrowProxy.contract.address, transfer.escrowAddress, log.blockNumber);
    transfer.resolutionEvent = await getParsedTransfer(provider, transfer.escrowAddress, null, log.blockNumber);
  }
  return pendingTransfers;
}; 

module.exports = pendingTransfersQuery;
