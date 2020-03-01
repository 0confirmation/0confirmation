'use strict';

const resultToJsonRpc = async (id, fn) => {
  try {
    return {
      id,
      result: await fn()
    };
  } catch (e) {
    return {
      id,
      error: e
    };
  }
};

module.exports = resultToJsonRpc;
