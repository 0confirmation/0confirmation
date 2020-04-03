'use strict';

const { Buffer } = require('safe-buffer');
const { Networks, Opcode, Script } = require('bitcore-lib');
const ethers = require('ethers');
const stripHexPrefix = (s) => s.substr(0, 2) === '0x' ? s.substr(2) : s;
const addHexPrefix = (s) => '0x' + stripHexPrefix(s);
const { isBuffer } = Buffer;
const { defaultAbiCoder: abi, solidityKeccak256, getCreate2Address } = require('ethers/utils');
const ShifterBorrowProxy = require('@0confirmation/sol/build/ShifterBorrowProxy');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const { linkBytecode: link } = require('solc/linker')
const { Contract } = require('ethers/contract');
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_PHASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const defaultProvider = ethers.getDefaultProvider();

const BYTES_TYPES = [ 'bytes' ];
const keccakAbiEncoded = (types, values) => solidityKeccak256(BYTES_TYPES, [ abi.encode(types, values) ])

const abiEncode = ([ types, params ]) => abi.encode(types, params);
const computePHash = (p) => solidityKeccak256([ 'bytes' ], [ p ]);
const maybeCoerceToPHash = (params) => Array.isArray(params) ? (!params[1] || params[1].length === 0) ? NULL_PHASH : computePHash(abiEncode(params)) : stripHexPrefix(params).length === 64 ? params : computePHash(params);

let cachedProxyCodeHash;

const initializeCodeHash = async () => {
  return cachedProxyCodeHash;
};

const computeLiquidityRequestHash = ({
  shifterPool,
  token,
  nonce,
  amount,
  gasRequested
}) => solidityKeccak256([
  'address',
  'address',
  'bytes32',
  'uint256',
  'uint256'
], [
  shifterPool,
  token,
  nonce,
  amount,
  gasRequested
]);

const computeBorrowProxyAddress = ({
  shifterPool,
  borrowProxyLib,
  borrower,
  token,
  nonce,
  amount
}) => {
  const salt = solidityKeccak256([
    'address',
    'address',
    'bytes32',
    'uint256'
  ], [
    borrower,
    token,
    nonce,
    amount
  ]);
  const shifterBorrowProxyBytecode = link(ShifterBorrowProxy.bytecode, {
    BorrowProxyLib: borrowProxyLib || BorrowProxyLib.networks[42].address
  });
  return getCreate2Address({
    from: shifterPool,
    salt: ethers.utils.arrayify(salt),
    initCode: ethers.utils.arrayify(shifterBorrowProxyBytecode)
  });
};

const computeGHash = ({
  to,
  tokenAddress,
  p,
  nonce
}) => keccakAbiEncoded([
  'bytes32',
  'address',
  'address',
  'bytes32'
], [
  maybeCoerceToPHash(p),
  tokenAddress,
  to,
  nonce
]);

const computeShiftInTxHash = ({
  renContract,
  utxo,
  g
}) => toBase64(solidityKeccak256([ 'string' ], [ `txHash_${renContract}_${toBase64(maybeCoerceToGHash(g))}_${toBase64(utxo.txHash)}_${utxo.vOut}` ]));

const maybeCoerceToShiftInHash = (input) => typeof input === 'object' ? computeShiftInTxHash(input) : input;

const computeNHash = ({
  txHash, // utxo hash
  vOut,
  nonce
}) => keccakAbiEncoded([
  'bytes32',
  'bytes32',
  'uint256'
], [
  nonce,
  txHash,
  vOut
]);

const maybeCoerceToNHash = (input) => typeof input === 'object' ? computeNHash(input) : input;

const computeHashForDarknodeSignature = ({
  p,
  n,
  amount,
  to,
  tokenAddress
}) => keccakAbiEncoded([
  'bytes32',
  'uint256',
  'address',
  'address',
  'bytes32'
], [
  maybeCoerceToPHash(p),
  amount,
  tokenAddress,
  to,
  maybeCoerceToNHash(n)
]);

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

const toHex = (input) => addHexPrefix(Buffer.from(input).toString('hex'));

Object.assign(module.exports, {
  computeGatewayAddress,
  computeLiquidityRequestHash,
  toBase64,
  toHex,
  computeBorrowProxyAddress,
  computeHashForDarknodeSignature,
  computeGHash,
  computePHash,
  computeNHash,
  stripHexPrefix,
  addHexPrefix,
  NULL_PHASH,
  NULL_ADDRESS,
  initializeCodeHash,
  computeShiftInTxHash
});
