'use strict';

const RpcEngine = require('json-rpc-engine');
const ethers = require('ethers');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');

const baseProviderProto = Object.getPrototypeOf(providerFromEngine(new RpcEngine()));

class BaseProvider {
  constructor(provider) { return makeBaseProvider(provider); }
  asEthers() {
    if (!this._ethers) this._ethers = new ethers.providers.Web3Provider(this);
    return this._ethers;
  }
  asMiddleware() {
    return providerAsMiddleware(this);
  }
}

const convertToBaseProvider = (provider) => Object.setPrototypeOf(provider, BaseProvider.prototype);

class PolymarketProviderEngine extends RpcEngine {
  asProvider() {
    return convertToBaseProvider(providerFromEngine(this));
  }
}

Object.setPrototypeOf(BaseProvider.prototype, baseProviderProto);

const makeBaseProvider = (provider) => {
  const engine = new PolymarketProviderEngine();
  const send = provider.send || provider.sendAsync;
  engine.push((req, res, next, end) => {
    send.call(provider, req, (err, result) => {
      Object.assign(res, result);
      end(err);
    });
  });
  return Object.assign(engine.asProvider(), {
    enable: provider.enable && provider.enable.bind(provider)
  });
};

module.exports = {
  makeBaseProvider,
  makeEngine: () => new PolymarketProviderEngine(),
  PolymarketProviderEngine,
  BaseProvider,
  convertToBaseProvider
};
