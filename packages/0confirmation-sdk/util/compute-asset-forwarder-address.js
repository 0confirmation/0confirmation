'use strict';

const assembleCloneCode = require('./assemble-clone-code');
const ethers = require('ethers');
const AssetForwarder = require('@0confirmation/sol/build/AssetForwarder');

const ASSET_FORWARDER_IMPLEMENTATION_SALT = ethers.utils.solidityKeccak256(['string'], ['asset-forwarder-implementation']);
const ASSET_FORWARDER_INITCODEHASH = ethers.utils.solidityKeccak256(['bytes'], [ AssetForwarder.bytecode ]);
const computeAssetForwarderAddress = (shifterPool, borrowProxy, index) => {
  const implementation = ethers.utils.getCreate2Address({
    from: shifterPool,
    salt: ethers.utils.arrayify(ASSET_FORWARDER_IMPLEMENTATION_SALT),
    initCodeHash: ethers.utils.arrayify(ASSET_FORWARDER_INITCODEHASH)
  });
  return ethers.utils.getCreate2Address({
    from: shifterPool,
    salt: ethers.utils.arrayify(ethers.utils.solidityKeccak256([
      'bytes32',
      'address',
      'bytes32'
    ], [
      ASSET_FORWARDER_IMPLEMENTATION_SALT,
      borrowProxy,
      ethers.utils.solidityKeccak256([ 'uint256' ], [ index ])
    ])),
    initCodeHash: ethers.utils.arrayify(ethers.utils.solidityKeccak256([ 'bytes' ], [ assembleCloneCode(shifterPool, implementation) ]))
  });
};

module.exports = computeAssetForwarderAddress;
