'use strict';

const soliditySha3 = require('web3-utils/src/soliditySha3');
const { Buffer } = require('safe-buffer');
const { Networks, Opcode, Script } = require('bitcore-lib');
const stripHexPrefix = (s) => s.substr(0, 2) === '0x' ? s.substr(2) : s;
const addHexPrefix = (s) => '0x' + stripHexPrefix(s);
const { isBuffer } = Buffer;

const computePHash = (args) => soliditySha3(...args);

const maybeCoerceToPHash = (params) => Array.isArray(params) ? computePHash : params;

const computeGHash = ({
  to,
  tokenAddress,
  params,
  nonce
}) => soliditySha3({
  t: 'bytes32',
  v: maybeCoerceToPHash(params)
}, {
  t: 'address',
  v: tokenAddress
}, {
  t: 'address',
  v: to
}, {
  t: 'bytes32',
  v: nonce
});

const computeShiftInTxHash = ({
  renContract,
  utxo,
  g
}) => soliditySha3(`txHash_${renContract}_${toBase64(maybeCoerceToGHash(g))}_${toBase64(utxo.txid)}_${utxo.output_no}`);

const maybeCoerceToShiftInHash = (input) => typeof input === 'object' ? computeShiftInTxHash(input) : input;

const computeNHash = ({
  txhash, // utxo hash
  vout,
  nonce
}) => soliditySha3({
  t: 'bytes32',
  v: nonce
}, {
  t: 'bytes32',
  v: txhash
}, {
  t: 'bytes32',
  v: vout
});

const maybeCoerceToNHash = (input) => typeof input === 'object' ? computeNHash(input) : input;

const computeHashForDarknodeSignature = ({
  p,
  amount,
  to,
  tokenAddress,
  nonce
}) => soliditySha3({
  t: 'bytes32',
  v: maybeCoerceToPHash(p)
}, {
  t: 'uint256',
  v: amount
}, {
  t: 'address',
  v: tokenAddress
}, {
  t: 'address',
  v: to
}, {
  t: 'bytes32',
  v: maybeCoerceToNHash(nonce)
});

const maybeCoerceToGHash = (input) => typeof input === 'object' ? computeGHash(input) : input;

const computeGatewayAddress = ({
  isTestnet,
  g,
  mpkh
}) => new Script()
  .add(Buffer.from(stripHexPrefix(maybeCoerceToGHash(g)), "hex"))
  .add(Opcode.OP_DROP)
  .add(Opcode.OP_DUP)
  .add(Opcode.OP_HASH160)
  .add(Buffer.from(stripHexPrefix(mpkh), "hex"))
  .add(Opcode.OP_EQUALVERIFY)
  .add(Opcode.OP_CHECKSIG)
  .toScriptHashOut().toAddress(isTestnet ? Networks.testnet : Networks.mainnet).toString();
  
const toBase64 = (input) => (isBuffer(input) ? input : Buffer.from(stripHexPrefix(input), 'hex')).toString('base64');

Object.assign(module.exports, {
  computeGatewayAddress,
  toBase64,
  computeHashForDarknodeSignature,
  computeGHash,
  computePHash,
  computeNHash,
  computeShiftInTxHash
});
