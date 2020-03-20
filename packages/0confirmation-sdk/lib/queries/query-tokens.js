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

const toResult = (payload, rawResult) => rawResult.map((v, i) => ({
  token: payload[i].token,
  name: v.name.success && decodeString(v.name.value) || null,
  symbol: v.symbol.success && decodeString(v.symbol.value) || null,
  decimals: v.decimals.success && decodeUint(v.symbol.value) || null,
  balances: v.balanceQueryResults.reduce((r, {
    success,
    value
  }, balanceQueryIndex) => {
    r[payload[i].balanceQueries[balanceQueryIndex]] = success ? decodeUint(value) : null;
    return r;
  }, {}),
  approvals: v.approvalQueryResults.reduce((r, {
    success,
    value
  }, approvalQueryIndex) => {
    const query = r[payload[i]].approvalQueries[approvalQueryIndex];
    const sourceApprovals = r[query.sourceAddress] = r[query.sourceAddress] || {};
    sourceApprovals[query.targetAddress] = success ? decodeUint(value) : null;
    return r;
  }, {})
}));

const queryTokens = async (provider, query) => {
  const wrappedProvider = new Web3Provider(provider);
  const [ from ] = await wrappedProvider.send('eth_accounts', []);
  const { abi, bytecode } = TokenQuery;
  const payload = toPayload(query);
  const encoded = stripHexPrefix(abi.encode(constructorAbi.inputs, [ payload ]));
  const result = await wrappedProvider.send('eth_call', [{
    data: bytecode + encoded
  }]);
  return toResult(payload, abi.decode(tokenResultAbi.inputs, result));
  return decoded;
};

Object.assign(module.exports, {
  queryTokens,
  toPayload,
  toResult
});
