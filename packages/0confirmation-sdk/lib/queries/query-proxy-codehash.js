'use strict';

const VM = require('ethereumjs-vm').default;
const BN = require('bn.js');
const { Buffer } = require('safe-buffer');
const util = require('../util');

const vm = new VM();

const GetShifterBorrowProxyInitCodeHash = require('@0confirmation/sol/build/GetShifterBorrowProxyInitCodeHash');

module.exports = async () => {
  const result = await vm.runCode({
    code: Buffer.from(util.stripHexPrefix(GetShifterBorrowProxyInitCodeHash.bytecode), 'hex'),
    gasLimit: new BN(0xffffffff)
  });
  return util.addHexPrefix(result.returnValue.toString('hex'));
};
