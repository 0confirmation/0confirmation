'use strict';

const truffleCompile = require('@truffle/workflow-compile/new');
const path = require('path');

(async () => {
  const config = {
    contracts_directory: path.parse(require.resolve('darknode-sol/contracts/Bindings.sol')).dir,
    contracts_build_directory: path.join(__dirname, '..', 'test', 'build'),
    compilers: {
      solc: {
        version: '0.5.12',
        docker: true
      }
    }
  };
  const { contracts } = await truffleCompile.compile(config);
  await truffleCompile.save(config, contracts);
  const vyperConfig = {
    contracts_directory: path.join(__dirname, '..', '..', '..', 'node_modules', 'contracts-vyper', 'contracts'),
    contracts_build_directory: path.join(__dirname, '..', 'test', 'build'),
    compilers: {
      vyper: {
        version: '0.1.0',
      }
    }
  };
  const contractsVyper = await truffleCompile.compile(vyperConfig);
  console.log(contractsVyper);
  await truffleCompile.save(vyperConfig, vyperContracts);
})().catch((err) => console.error(err.stack));
