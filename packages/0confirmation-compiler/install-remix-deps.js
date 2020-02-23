'use strict';

const child_process = require('child_process');
const path = require('path');
process.chdir(path.parse(require.resolve('remix-ide/package')).dir);
child_process.spawnSync('npx', [ 'yarn' ], { stdio: 'inherit' });
