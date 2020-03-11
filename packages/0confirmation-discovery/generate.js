'use strict';

const peerId = require('peer-id');

(async () => {
  console.log(JSON.stringify((await peerId.create()).toJSON(), null, 1));
})().catch((err) => console.error(err));
