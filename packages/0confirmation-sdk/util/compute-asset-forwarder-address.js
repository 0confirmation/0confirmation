'use strict';

const assembleCloneCode = require('./assemble-clone-code');
const { getCreate2Address } = require('@ethersproject/address');
const AssetForwarder = require('@0confirmation/sol/build/AssetForwarderFreeze');
const AssetForwarderTest = require('@0confirmation/sol/build/AssetForwarder');
const assetForwarderBytecode = Boolean(process.env.DEBUG || process.env.REACT_APP_CHAIN === 'test') ? AssetForwarderTest.bytecode : AssetForwarder.bytecode;
const { keccak256 } = require('@ethersproject/solidity');
const { arrayify } = require('@ethersproject/bytes');

const ASSET_FORWARDER_IMPLEMENTATION_SALT = keccak256(['string'], ['asset-forwarder-implementation']);
const ASSET_FORWARDER_INITCODEHASH = keccak256(['bytes'], [ assetForwarderBytecode ]);
const computeAssetForwarderAddress = (shifterPool, borrowProxy, index) => {
  const implementation = getCreate2Address(
    shifterPool,
    arrayify(ASSET_FORWARDER_IMPLEMENTATION_SALT),
    arrayify(ASSET_FORWARDER_INITCODEHASH)
  );
  return getCreate2Address(
    shifterPool,
    arrayify(keccak256([
      'bytes32',
      'address',
      'bytes32'
    ], [
      ASSET_FORWARDER_IMPLEMENTATION_SALT,
      borrowProxy,
      keccak256([ 'uint256' ], [ index ])
    ])),
    arrayify(keccak256([ 'bytes' ], [ assembleCloneCode(shifterPool.toLowerCase(), implementation.toLowerCase()) ]))
  );
};

module.exports = computeAssetForwarderAddress;
