'use strict';

const globalObject = require('the-global-object');

const { _bitcore, _bitcoreCash } = globalObject;
delete globalObject._bitcore;
delete globalObject._bitcoreCash;
const RenVM = require('@renproject/ren').default;
const Common = require('@renproject/ren-js-common');

Object.assign(globalObject, {
  _bitcore,
  _bitcoreCash
});

Object.assign(module.exports, {
  RenVM,
  Common
});
