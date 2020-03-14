'use strict';

const path = require('path');
const truffleCompile = require('@truffle/workflow-compile/new');

const build = async (contracts_build_directory) => {
  const cwd = process.cwd();
  process.chdir(__dirname);
  const config = {
    contracts_directory: path.parse(require.resolve('darknode-sol/contracts/Bindings.sol')).dir,
    contracts_build_directory,
    compilers: {
      solc: {
        version: '0.5.12'
      }
    }
  };
  console.log('Building darknode-sol artifacts');
  const { contracts } = await truffleCompile.compile(config);
  await truffleCompile.save(config, contracts);
  process.chdir(cwd);
};

module.exports = build;
