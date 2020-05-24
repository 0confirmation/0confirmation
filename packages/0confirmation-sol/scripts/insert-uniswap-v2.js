'use strict';

const fs = require('fs');
const path = require('path');

[
  'UniswapV2Router01',
  'UniswapV2Factory',
  'UniswapV2Pair',
  'WETH9'
].forEach((v) => {
  const artifact = require('@0confirmation/uniswap-v2/build/' + v + '.json');
  artifact.contractName = v;
  fs.writeFileSync(path.join(__dirname, '..', 'build', v + '.json'), JSON.stringify(artifact, null, 2));
});
