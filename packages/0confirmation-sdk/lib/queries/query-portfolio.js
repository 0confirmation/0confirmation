'use strict';

const { toPayload, queryTokens } = require('./query-tokens');
const PortfolioQuery = require('@0confirmation/sol/build/PortfolioQuery');
const abi = require('ethers/utils').defaultAbiCoder;
const { stripHexPrefix } = require('../util');
const mapValues = require('lodash/mapValues');
const constructorAbi = PortfolioQuery.abi.find((v) => v.name === 'constructor');
const resultAbi = PortfolioQuery.abi.find((v) => v.name === 'PortfolioQueryExport');

const queryPortfolio = (provider, borrowProxyAddress, liquidationModuleAddress, initiallyBorrowedToken, approvalQueries) => {
  const query = toPayload([{
    token: initiallyBorrowedToken,
    balanceQueries: [ borrowProxyAddress ],
    approvalQueries: {
      [ borrowProxyAddress ]: approvalQueries || []
    }
  }])[0];
  const encoded = stripHexPrefix(abi.encode(constructorAbi.inputs, [ borrowProxyAddress, liquidationModuleAddress, query ]));
  const result = abi.decode([ resultAbi ], await (new Web3Provider(provider)).send('eth_call', [{
    data: PortfolioQuery + encoded
  }]))[0];
  const mockPayload = toPayload(result.map((v) => ({
    token: v.token,
    balanceQueries: [ borrowProxyAddress ],
    approvalQueries: {
      [ borrowProxyAddress ]: approvalQueries || []
    }
  })));
  const tokenQueryResult = toResult(mockPayload, result);
  const borrowProxySpecificResult = Object.assign(tokenQueryResult, {
    approvals: tokenQueryResult.approvals[borrowProxyAddress] || [],
    balance: tokenQueryResult.balances[borrowProxyAddress]
  });
  delete borrowProxySpecificResult.balances;
  return borrowProxySpecificResult;
};

module.exports = queryPortfolio;
