'use strict';

const { save, compile } = require('@truffle/workflow-compile/new');
const truffleConfig = require('./truffle-config-factory');

(async () => {
  const compiled = await compile(truffleConfig);
  await save(truffleConfig, compiled.contracts);
})().catch((err) => console.error(err));
