'use strict';

const { Web3Provider } = require('ethers/providers/web3-provider');
const TokenQuery = require('@0confirmation/sol/build/TokenQuery');
const utils = require('ethers/utils');
const abi = utils.defaultAbiCoder;
const { stripHexPrefix } = require('../util');

const constructorAbi = TokenQuery.abi.find((v) => v.name === 'constructor');
const tokenResultAbi = TokenQuery.abi.find((v) => v.name === 'TokenQueryPayloadExport');

const toPayload = (ary) => ary.map((v) => Object.assign({}, v, {
  approvalQueries: Object.keys(v.approvalQueries).reduce((r, user) => r.concat(v.approvalQueries[user].map((targetAddress) => ({
    sourceAddress: user,
    targetAddress
  }))), [])
}));

const toResult = (payload, rawResult) => keyBy(payload.map((v, i) => 

module.exports = async (provider, query) => {
  const wrappedProvider = new Web3Provider(provider);
  const [ from ] = await wrappedProvider.send('eth_accounts', []);
  const { abi, bytecode } = TokenQuery;
  const encoded = stripHexPrefix(abi.encode(constructorAbi.inputs, [ toPayload(query) ]));
  const result = await wrappedProvider.send('eth_call', [{
    data: bytecode + encoded
  }]);
  const decoded = abi.decode(tokenResultAbi.inputs, result);
  return decoded;
};
