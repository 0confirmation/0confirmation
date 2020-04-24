'use strict';

delete global._bitcore;
delete global._bitcoreCash;
const RenJS = require('@renproject/ren').default;
delete global._bitcore;
delete global._bitcoreCash;
const uniswap = require('@uniswap/sdk');
const ethers = require('ethers');
const randomBytes = require('random-bytes').sync;
const makeMockBackends = require('../mock');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool')
const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const Curvefi = require('@0confirmation/sol/build/Curvefi');
const CurveToken = require('@0confirmation/sol/build/CurveToken');
const Exchange = require('@0confirmation/sol/build/Exchange');
const Factory = require('@0confirmation/sol/build/Factory');

const chainIdFromNetwork = (network) => {
  switch (network) {
    case 'ganache':
      return Math.max(...Object.keys(ShifterPool.networks).map(Number));
    case 'kovan':
      return 42;
    case 'mainnet':
      return 1;
  }
};

const fromArtifact = (network, artifact) => (artifact.networks[chainIdFromNetwork(network)] || {}).address;

const renNetworkFromNetwork = (network) => {
  switch (network) {
    case 'testnet':
      return 'testnet';
    case 'mainnet':
      return 'chaosnet';
  }
  return network;
};

const renvmFromEnvironment = (network) => {
  if (network === 'ganache') {
    return {
      shifterRegistry: fromArtifact(network, ShifterRegistryMock),
      mpkh: '0x' + randomBytes(32).toString('hex')
    }
  }
  const renvm = new RenJS(renNetworkFromNetwork(network));
  const chainId = chainIdFromNetwork(network);
  const renbtcShifter = fromArtifact(network, renvm.network.contracts.addresses.shifter.BTCShifter.artifact);
  const renbtc = renvm.network.contracts.addresses.tokens.BTC.address;
  const shifterRegistry = renvm.network.contracts.addresses.shifter.ShifterRegistry.address;
  const mpkh = renvm.network.contracts.renVM.mpkh;
  return {
    renbtcShifter,
    renbtc,
    shifterRegistry,
    mpkh
  }
};

const zeroContractsFromNetwork = (network) => {
  const chainId = chainIdFromNetwork(network);
  return {
    shifterPool: fromArtifact(network, ShifterPool),
    borrowProxyLib: fromArtifact(network, ShifterPool)
  };
};

const uniswapFromNetwork = (network) => ({
  factory: network === 'ganache' ? fromArtifact(network, Factory) : uniswap.FACTORY_ADDRESS[chainIdFromNetwork(network)],
  template: network === 'ganache' ? fromArtifact(network, Exchange) : '0x68Da056feB1158B8c4726830cF76B23905A7eb1D',
});

const curveFromNetwork = (network) => ({
  curve: fromArtifact(network, Curvefi),
  curveToken: fromArtifact(network, CurveToken)
});

const getAddresses = (network) => ({
  ...curveFromNetwork(network),
  ...uniswapFromNetwork(network),
  ...zeroContractsFromNetwork(network),
  ...renvmFromEnvironment(network)
});

const getEnvironment = (provider, network, backends) => ({
  backends: backends || {
    ethereum: {
      provider
    },
    zero: {
      multiaddr: 'lendnet',
      dht: true
    },
    btc: {
      network
    },
    renvm: {
      network: renvmNetworkFromNetwork(network)
    }
  },
  ...getAddresses(network)
});

const getMockEnvironment = (provider) => getEnvironment(provider, 'ganache', makeMockBackends(provider));

const { makeManagerClass } = require('../manager');

const FactoryManager = makeManagerClass(Factory);
const ExchangeManager = makeManagerClass(Exchange);
const CurvefiManager = makeManagerClass(Curvefi);
const ShifterPoolManager = makeManagerClass(ShifterPool);
const CurveTokenManager = makeManagerClass(CurveToken);

Object.assign(module.exports, {
  getAddresses,
  FactoryManager,
  ExchangeManager,
  CurvefiManager,
  ShifterPoolManager,
  CurveTokenManager,
  getEnvironment,
  getMockEnvironment
});

