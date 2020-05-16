'use strict';

const globalObject = require('the-global-object');
const Common = require('@renproject/interfaces');

const { _bitcore, _bitcoreCash } = globalObject;
delete globalObject._bitcore;
delete globalObject._bitcoreCash;
const RenVM = require('@renproject/ren').default;

Object.assign(globalObject, {
  _bitcore,
  _bitcoreCash
});

Object.assign(module.exports, {
  RenVM,
  Common
});
