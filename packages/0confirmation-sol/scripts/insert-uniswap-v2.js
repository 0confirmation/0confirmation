'use strict';

const fs = require('fs');
const path = require('path');

[
  'UniswapV2Router01',
  'UniswapV2Factory',
  'WETH9'
].forEach((v) => fs.writeFileSync(path.join(__dirname, '..', 'build', v + '.json'), JSON.stringify(require('@0confirmation/uniswap-v2/build/' + v), null, 2)));
