'use strict';

const makeMockBtcBackend = require('./btc');
const makeMockZeroBackend = require('./zero');
const makeMockRenVMBackend = require('./renvm');

const makeMockBackends = (provider) => ({
  ethereum: {
    provider
  },
  btc: makeMockBtcBackend(),
  renvm: makeMockRenVMBackend(),
  zero: makeMockZeroBackend()
});

module.exports = makeMockBackends;
