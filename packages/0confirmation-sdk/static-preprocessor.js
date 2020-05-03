'use strict';

const ethers = require('ethers');
const emasm = require('emasm');
const opcodes = require('emasm/lib/ops');
const staticPreprocessorInterface = new ethers.utils.Interface([{
  type: 'function',
  name: 'setup',
  inputs: [{
    name: 'consData',
    type: 'bytes'
  }]
}]);

const setupSignature = staticPreprocessorInterface.functions.setup.sighash;
const randomBytes = require('random-bytes').sync;
const generateRandomTag = () => randomBytes(4).toString('hex');
const push20Opcode = '0x' + (Number('0x' + opcodes.push) + 19).toString(16);
const encodeAddressAsPush20 = (address) => [ 'bytes:' + generateRandomTag(), [ push20Opcode + address.substr(2) ] ];
const makeStaticPreprocessor = (implementationAddress, consData) => emasm([
  '0x0',
  '0x0',
  setupSignature + Array(56).fill('0').join(''),
  '0x0',
  'mstore',
  'bytes:setup-data:size',
  'dup1',
  '0x4',
  'add',
  'swap1',
  'bytes:setup-data:ptr',
  '0x4',
  'codecopy', // [ calldata:size, 0x0, 0x0 ]
  '0x0', // [ 0x0, calldata:size, 0x0, 0x0 ]
  encodeAddressAsPush20(implementationAddress), // [ implementation, 0x0, setup-calldata:size + 4, 0x0, 0x0 ]
  'gas', // [ gas, implementation, 0x0, calldata:size, 0x0, 0x0 ]
  'delegatecall', // [ setup-success ]
  'iszero',
  'handle-setup-revert',
  'jumpi', // [ ]
  'bytes:delegator-runtime:size',
  'dup1',
  'bytes:delegator-runtime:ptr',
  '0x0',
  'codecopy', // [ delegator-runtime:size ]
  '0x0',
  'return',
  [ 'handle-setup-revert', [
    'returndatasize',
    'dup1',
    '0x0',
    '0x0',
    'returndatacopy',
    '0x0',
    'revert'
  ] ],
  [ 'bytes:delegator-runtime:ptr', [ emasm([
    '0x0',
    'calldatasize', // [ calldata:size, 0x0 ]
    '0x0', // [ 0x0, calldata:size, 0x0 ]
    '0x0', // [ 0x0, 0x0, calldata:size, 0x0 ],
    'calldatacopy',
    '0x0',
    '0x0',
    'calldatasize',
    '0x0', // [ 0x0, calldata:size, 0x0, 0x0, 0x0 ]
    encodeAddressAsPush20(implementationAddress), // [ implementation, 0x0, calldata:size, 0x0, 0x0, 0x0 ]
    'gas',
    'delegatecall', // [ success, 0x0 ]
    'returndatasize', // [ returndatasize, success, 0x0 ]
    'swap2', // [ 0x0, success, returndatasize ]
    'swap1', // [ success, 0x0, returndatasize ]
    'returndatasize', // [ returndatasize, success, 0x0, returndatasize ]
    '0x0',
    '0x0',
    'returndatacopy', // [ success, 0x0, returndatasize ]
    'iszero', // [ failure, 0x0, returndatasize ]
    'handle-revert',
    'jumpi',
    'return',
    [ 'handle-revert', [
      'revert'
    ] ]
  ]) ] ],
  [ 'bytes:setup-data', [ consData ] ]
]);

module.exports = makeStaticPreprocessor;
