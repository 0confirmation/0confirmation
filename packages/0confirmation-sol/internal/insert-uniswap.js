'use strict';

const fs = require('fs');
const path = require('path');

const Exchange = {
  contractName: 'Exchange',
  abi: require('contracts-vyper/abi/uniswap_exchange'),
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/exchange.txt'), 'utf8').trim()
};

const Factory = {
  contractName: 'Factory',
  abi: require('contracts-vyper/abi/uniswap_factory'),
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/factory.txt'), 'utf8').trim()
};

[ Exchange, Factory ].forEach((v) => fs.writeFileSync(path.join(__dirname, '..', 'build', v.contractName + '.json'), JSON.stringify(v, null, 2)));
