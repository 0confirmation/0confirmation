'use strict';

const { RenVM } = require('@0confirmation/renvm');
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
const DAI = require('@0confirmation/sol/build/DAI');
const SwapEntireLoan = require('@0confirmation/sol/build/SwapEntireLoan');
const TransferAll = require('@0confirmation/sol/build/TransferAll');

const chainIdFromNetwork = (network) => {
  switch (network) {
    case 'ganache':
      return Math.max(...Object.keys(ShifterPool.networks).map(Number));
    case 'testnet':
      return 42;
    case 'mainnet':
      return 1;
  }
};

const fromArtifact = (network, artifact) => ((artifact.networks || {})[chainIdFromNetwork(network)] || {}).address;

const renNetworkFromNetwork = (network) => {
  switch (network) {
    case 'testnet':
    case 'ganache':
      return 'testnet';
    case 'mainnet':
      return 'chaosnet';
  }
  return network;
};

const renvmFromEnvironment = (network) => {
  if (network === 'ganache' || network === 'test') {
    return {
      shifterRegistry: fromArtifact(network, ShifterRegistryMock),
      mpkh: '0x' + randomBytes(32).toString('hex')
    }
  }
  const renvm = new RenVM(renNetworkFromNetwork(network));
  const chainId = chainIdFromNetwork(network);
  const renbtcShifter = renvm.network.addresses.gateways.BTCGateway._address;
  const renbtc = renvm.network.addresses.tokens.BTC.address;
  const shifterRegistry = renvm.network.addresses.gateways.GatewayRegistry.address;
  const mpkh = network === 'mainnet' ? '0x5faa9576e45acbc9662b6abf323229b748a9495d' : '0xc998b2a88ac96676e14f07739003419799a6823a';
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
    transferAll: fromArtifact(network, TransferAll),
    swapEntireLoan: fromArtifact(network, SwapEntireLoan)
  };
};

const uniswapFromNetwork = (network) => ({
  factory: uniswap.FACTORY_ADDRESS,
  router: '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
});

const curveFromNetwork = (network) => ({
  curve: fromArtifact(network, Curvefi),
  curveToken: fromArtifact(network, CurveToken)
});

const daiFromNetwork = (network) => {
  if (network === 'ganache') {
    return {
      dai: fromArtifact(network, DAI)
    };
  } else if (network === 'testnet') {
    return {
      dai: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa'
    };
  } else if (network === 'mainnet') {
    return {
      dai: '0x6b175474e89094c44da98b954eedeac495271d0f'
    };
  }
};

const getAddresses = (network) => ({
  ...curveFromNetwork(network),
  ...uniswapFromNetwork(network),
  ...zeroContractsFromNetwork(network),
  ...renvmFromEnvironment(network),
  ...daiFromNetwork(network)
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
      network: renNetworkFromNetwork(network)
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

