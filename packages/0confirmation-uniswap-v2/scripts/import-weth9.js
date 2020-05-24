'use strict';

const weth = require('canonical-weth/build/contracts/WETH9');
const fs = require('fs');
const mkdirp = require('mkdirp').sync;
const path = require('path');

const buildPath = path.join(__dirname, '..', 'build');
mkdirp(buildPath);
fs.writeFileSync(path.join(buildPath, 'WETH9.json'), JSON.stringify(weth, null, 2));
