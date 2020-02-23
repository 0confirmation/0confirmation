'use strict';

const solc = require('solc');
const {
  compileSourceTree
} = require('@0confirmation/compiler');
global.document = {};

(async () => {
  const source = await compileSourceTree('./contracts', [], {
    'settings/gist-access-token': process.env.SOLC_GIST_ACCESS_TOKEN
  });
  console.log(require('util').inspect(source, { depth: 15 }));
})().catch((err) => console.error(err));
