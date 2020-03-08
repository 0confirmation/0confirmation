'use strict';

const path = require('path');
const buildDarknodeSol = require('@0confirmation/darknode-sol');

(async () => {
  await buildDarknodeSol(path.join(__dirname, '..', 'build'))
})().catch((err) => console.error(err));
