'use strict';

module.exports = (provider) => {
  provider.sendAsync = provider.sendAsync || provider.send;
  return provider;
};
