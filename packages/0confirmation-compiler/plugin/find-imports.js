'use strict';

const CompilerImports = require('remix-ide/src/app/compiler/compiler-imports').default;
const registry = require('remix-ide/src/global/registry');
const request = require('remix-ide/node_modules/request');
const oldGet = request.get;
request.get = (...args) => {
  let [ first, ...rest ] = args;
  if (typeof first === 'string') first = {
    url: first,
    headers: {
      'user-agent': 'request'
    }
  };
  else {
    first.headers = Object.assign(first.headers || {}, {
      'user-agent': 'request'
    });
  }
  return oldGet.call(request, first, ...rest);
};
console.log

Object.assign(module.exports, {
  CompilerImports,
  registry
});
