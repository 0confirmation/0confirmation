'use strict';

const ExtractedRemixImportPlugin = require('./compiler-imports');

(async () => {
  const plugin = new ExtractedRemixImportPlugin();
  await plugin.runProcess();
})().catch((err) => console.error(err.stack));
