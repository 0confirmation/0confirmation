'use strict';

const { Web3Provider } = require('ethers/providers/web3-provider');
const { id } = require('ethers/utils');
const {
  Provider: {
    isProvider
  }
} = require('ethers/providers');
const abi = require('ethers/utils').defaultAbiCoder;
const { RPCWrapper }  = require('../../util');

const stripHexPrefix = (s) => s.substr(0, 2) === '0x' ? s.substr(2) : s;

const PROXY_SIGNATURE = id('proxy(address,uint256,bytes)').substr(0, 10);

const providerMethods = {
  eth_accounts(driver) {
    return async () => {
      const accounts = await driver.getBackend('ethereum').asWrapped().send('eth_accounts', []);
      return driver.getActiveBorrowProxy(accounts).borrower;
    };
  },
  eth_sign() {
    return async () => {
      throw Error('borrow proxy cannot sign messages');
    };
  },
  async eth_sendTransaction(driver) {
    return async (params) => {
      const [ payload ] = params;
      const accounts = await driver.getBackend('ethereum').asWrapped().send('eth_accounts', []);
      const proxy = await (driver.getBackend('zero').asWrapped()).send('0cf_getActiveBorrowProxy', [ accounts ]);
      return await (driver.getBackend('ethereum').asWrapped()).send('eth_sendTransaction', [{
        from: proxy.borrower,
        to: proxy.address,
        data: PROXY_SIGNATURE + stripHexPrefix(abi.encode(['address', 'uint256', 'bytes' ], [ payload.to, payload.value, payload.data ])),
        value: params.value,
        gasPrice: params.gasPrice,
        gas: params.gas
      }]);
    };
  }
};

const mapProviderMethods = (driver) => Object.keys(providerMethods).reduce((r, v) => {
  r[v] = providerMethods[v](driver);
  return r;
}, {});

const makeSend = (driver) => {
  const mappedMethods = mapProviderMethods(driver);
  return async (payload) => {
    const { method, id } = payload;
    const impl = mappedMethods[method];
    if (impl) {
      try {
        const result = await impl(payload);
        return {
          id,
          result,
        };
      } catch (e) {
        return {
          id,
          error: e
        };
      }
    }
    return await driver.ethereum._cache.send.apply(driver.ethereum._cache.provider, [ payload ]);
  };
};

const makeProviderProxy = (driver) => { 
  const proxy = {};
  Object.defineProperty(proxy, 'host', {
    get() {
      return driver.ethereum._cache.provider.host;
    },
    set(v) {
      driver.ethereum._cache.provider.host = v;
    }
  });
  Object.defineProperty(proxy, 'connected', {
    get() {
      return driver.ethereum._cache.provider.connected;
    },
    set(v) {
      driver.ethereum._cache.provider.connected = v;
    }
  });
  proxy.send = makeSend(driver);
  return proxy;
};

const install = (driver) => {
  const proxy = makeProviderProxy(driver);
  driver.ethereum._cache.provider.send = proxy.send;
};

const uninstall = (driver) => {
  driver.ethereum._cache.provider.send = driver.ethereum._cache.send;
};

class EthereumBackend extends RPCWrapper {
  constructor({
    driver,
    provider
  }) {
    super();
    this.name = 'ethereum';
    this.prefixes = ['eth', 'personal'];
    this.driver = driver;
    this.provider = provider;
    this._cache = {
      provider,
      send: provider.send
    };
  }
  async send(o) {
    return await this.provider.send(o);
  }
  injectProvider() {
    install(this.driver);
  }
  uninstall() {
    uninstall(this.driver);
  }
  getProvider() {
    return makeProviderProxy(this.driver);
  }
}

module.exports = EthereumBackend;
