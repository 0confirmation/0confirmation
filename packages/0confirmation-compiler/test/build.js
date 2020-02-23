'use strict';

const { compileSourceTree } = require('../');

(async () => {
  console.log(await compileSourceTree('./', [], { 'settings/gist-access-token': 'fe159ef9bd9e538b63b9852026def3fcad59f176' }));
})().catch((err) => console.error(err.stack));
