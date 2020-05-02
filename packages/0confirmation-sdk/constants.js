'use strict';

const ethers = require('ethers');
const { defaultAbiCoder: abi } = ethers.utils;
const { toBase64 } = require('./util');
const DARKNODE_QUERY_TX_INTERVAL = 5000;
const UTXO_POLL_INTERVAL = 5000;

const pAbi = {
  name: 'shiftIn',
  type: 'function',
  constant: false,
  inputs: [{
    type: 'address',
    name: '_shifterRegistry',
    value: ethers.constants.AddressZero
  }, {
    type: 'string',
    name: '_symbol',
    value: ''
  }, {
    type: 'address',
    name: '_address',
    value: ethers.constants.AddressZero
  }]
};

const pAbiValue = abi.encode(pAbi.inputs.map((v) => v.type), [ ethers.constants.AddressZero, '', ethers.constants.AddressZero ]);

const pAbiValueB32 = toBase64(pAbiValue);


const pAbiExpanded = Object.assign({}, pAbi, {
  inputs: [{
    name: "_amount",
    type: "uint256"
  }, {
    name: "_nHash",
    type: "bytes32"
  }, {
    name: "_sig",
    type: "bytes"
  }]
});
const CONST_P_VALUE_B32 = toBase64(pAbiValue);
const CONST_PHASH = ethers.utils.solidityKeccak256(['bytes'], [ pAbiValue ]);
const CONST_P_ABI_B64 = toBase64(Buffer.from(JSON.stringify([ pAbiExpanded ])).toString('hex'));
const CONST_P_FN_B64 = toBase64(Buffer.from('shiftIn').toString('hex'))

Object.assign(module.exports, {
  ZERO_ADDRESS: ethers.constants.AddressZero,
  CONST_PHASH,
  CONST_P_VALUE_B32,
  CONST_P_ABI_B64,
  CONST_P_FN_B64,
  DARKNODE_QUERY_TX_INTERVAL,
  UTXO_POLL_INTERVAL
});
