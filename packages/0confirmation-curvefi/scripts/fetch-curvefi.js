'use strict';

const child_process = require('child_process');
const path = require('path');
const bluebird = require('bluebird');
const [
  glob,
  ncp,
  rimraf
] = [
  require('glob'),
  require('ncp').ncp,
  require('rimraf')
].map((v) => bluebird.promisify(v));
const mkdirp = require('mkdirp');

(async () => {
  await rimraf(path.join(__dirname, '..', 'curve-contract'));
  await rimraf(path.join(__dirname, '..', 'contracts'));
  await mkdirp(path.join(__dirname, '..', 'contracts'));
  child_process.spawnSync('git', [ 'clone', 'https://github.com/curvefi/curve-contract', path.join(__dirname, '..', 'curve-contract') ], { stdio: 'inherit' });
  // its cloned
  const globbed = await glob(path.join(__dirname, '..', 'curve-contract', '**', '*.vy'));
  for (const vyperContractFilePath of globbed) {
    const { base } = path.parse(vyperContractFilePath);
    await ncp(vyperContractFilePath, path.join(__dirname, '..', 'contracts', base));
  }
  await rimraf(path.join(__dirname, '..', 'curve-contract'));
})().catch((err) => console.error(err));
