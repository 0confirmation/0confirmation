'use strict';

const { compile, save } = require('@truffle/workflow-compile/new');
const truffleConfig = require('./truffle-config-router');

(async () => {
  const compiled = await compile(truffleConfig);
  await save(truffleConfig, compiled.contracts);
})().catch((err) => console.error(err));
