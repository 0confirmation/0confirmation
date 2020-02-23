'use strict';

const { compileSourceTree, saveSourceTree } = require('./compiler');

(async () => {
  console.log(await compileSourceTree('../iso-contracts/contracts'));
//  await saveSourceTree('../iso-contracts/contracts');
})().catch((err) => console.error(err.stack));
