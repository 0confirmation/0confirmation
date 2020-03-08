'use strict';

const truffleCompile = require('@truffle/workflow-compile/new');
const path = require('path');
const chalk = require('chalk');

(async () => {
  const config = {
    contracts_directory: path.join(__dirname, '..', 'contracts'),
    contracts_build_directory: path.join(__dirname, '..', 'build'),
    compilers: {
      solc: {
        version: 'stable',
        docker: true
      }
    }
  };
  console.log('Building 0confirmation artifacts');
  const { contracts } = await truffleCompile.compile(config);
  await truffleCompile.save(config, contracts);
})().catch((err) => console.error(err));
