'use strict';

const timeout = (n) => new Promise((resolve) => setTimeout(resolve, n));
Object.assign(module.exports, {
  resultToJsonRpc: require('./result-to-jsonrpc'),
  RPCWrapper: require('./rpc-wrapper'),
  fixSignature: require('./fix-signature'),
  timeout
}, require('./ren'));
