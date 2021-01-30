'use strict';

const { joinSignature, splitSignature } = require('@ethersproject/bytes');

const fixSignature = (signature) => joinSignature(splitSignature(signature));

module.exports = fixSignature;
