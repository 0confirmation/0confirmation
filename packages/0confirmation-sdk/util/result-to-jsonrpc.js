'use strict';

const resultToJsonRpc = async (id, fn) => {
  try {
    return {
      jsonrpc: '2.0',
      id,
      result: await fn()
    };
  } catch (e) {
    return {
      jsonrpc: '2.0',
      id,
      error: e
    };
  }
};

module.exports = resultToJsonRpc;
