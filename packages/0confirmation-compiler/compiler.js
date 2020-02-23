'use strict';

const solc = require('solc');
const fs = require('fs-extra');
const linker = require('solc/linker');
const glob = require('glob');
const path = require('path');
const mkdirp = require('mkdirp');
const globToRegexp = require('glob-to-regexp');
const ExtractedRemixImportPlugin = require('./compiler-imports');

const globToPromise = async (dir) => await new Promise((resolve, reject) => glob(dir, (err, result) => err ? reject(err) : resolve(result)));

const compileSourceTreeCustomSolc = async (solcCustom, dir, exclude, apiKeys) => {
  dir = coerceToCwd(dir);
  const globbed = await globToPromise(path.join(dir, '**', '*.sol'));
  const regexps = (!Array.isArray(exclude) ? [ exclude ] : exclude).map((v) => globToRegexp(v));
  const source = await Promise.all(globbed.filter((v) => !exclude || !regexps.find((regexp) => regexp.test(v))).map(async (v) => {
    return [ coerceToCwd(v).split(dir)[1], await fs.readFile(v, 'utf8') ];
  }));
  const plugin = new ExtractedRemixImportPlugin(solcCustom);
  Object.keys(apiKeys).forEach((key) => {
    plugin.put(key, apiKeys[key]);
  });
  return JSON.parse(solcCustom.compile(JSON.stringify({
    language: 'Solidity',
    sources: source.reduce((r, [ filepath, source ]) => {
      r[filepath] = {
        content: source
      }
      return r;
    }, {}),
    settings: {
      outputSelection: {
        '*': {
          '*': [
            'abi', 'evm.bytecode.object', 'evm.bytecode.linkReferences'
          ]
        }
      }
    }
  }), plugin.get()));
};

const coerceToCwd = (s) => (s.substr(0, 2) === '.' + path.sep || s[0] === path.sep || s.substr(0, 3) === '..' + path.sep) && s || './' + s;

const compileSourceTree = async (dir, exclude, apiKeys) => compileSourceTreeCustomSolc(solc, dir, exclude, apiKeys);

const saveSourceTree = async (dir, sourceTree) => {
  const paths = Object.keys(sourceTree);
};
    
const toLinkKey = (fileRef, contractRef) => `${fileRef}:${contractRef}`
const fromLinkKey = (key) => key.split(':')

Object.assign(module.exports, {
  compileSourceTreeCustomSolc,
  compileSourceTree,
  saveSourceTree,
  toLinkKey,
  fromLinkKey
});
