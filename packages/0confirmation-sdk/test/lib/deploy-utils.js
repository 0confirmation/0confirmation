'use strict';

const { soliditySha3: id } = require('web3-utils');
const stripHexPrefix = (s) => s.substr(0, 2) === '0x' ? s.substr(2) : s;
const addHexPrefix = (s) => s.substr(0, 2) === '0x' ? s : '0x' + s;
const abi = require('ethers/utils').defaultAbiCoder;

const encodeParameters = (types, params) => stripHexPrefix(abi.encode(types, params));

const encodeFunctionCall = (sig, types, inputs) => addHexPrefix(id(sig).substr(0, 10)) + encodeParameters(types, inputs);

const defaultTransaction = (o) => Object.assign({
  gasPrice: '0x1',
  gas: '0x' + (6e6).toString(16)
}, o);

const testDeploy = async (provider, binary, types, params) => {
  const [ from ] = await provider.send('eth_accounts', []);
  const receipt = await provider.waitForTransaction(await provider.send('eth_sendTransaction', [ defaultTransaction({
    from,
    data: addHexPrefix(binary + (types && encodeParameters(types, params) || ''))
  }) ]));
  return receipt.contractAddress.toLowerCase();
};

Object.assign(module.exports, {
  stripHexPrefix,
  addHexPrefix,
  encodeParameters,
  encodeFunctionCall,
  defaultTransaction,
  testDeploy,
  id
});
