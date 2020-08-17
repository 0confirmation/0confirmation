'use strict';

const { RenVM } = require('@0confirmation/renvm');
const uniswap = require('@uniswap/sdk');
const ethers = require('ethers');
const randomBytes = require('random-bytes').sync;
const makeMockBackends = require('../mock');
const ShifterPool = {
  kovan: require('@0confirmation/sol/deployments/kovan/ShifterPool'),
  mainnet: require('@0confirmation/sol/deployments/live_1/ShifterPool')
};
//const ShifterRegistryMock = require('@0confirmation/sol/deployments/kovan/ShifterRegistryMock');
const UniswapV2Factory = {
  kovan: require('@0confirmation/sol/deployments/kovan/UniswapV2Factory')
};
const UniswapV2Router01 = {
  kovan: require('@0confirmation/sol/deployments/kovan/UniswapV2Router01')
};
const DAI = {
  kovan: require('@0confirmation/sol/deployments/kovan/DAI')
};
const WETH9 = {
  kovan: require('@0confirmation/sol/deployments/kovan/WETH9')
};
//const SwapEntireLoan = require('@0confirmation/sol/deployments/kovan/SwapEntireLoan');
//const TransferAll = require('@0confirmation/sol/deployments/kovan/TransferAll');
const V2SwapAndDrop = {
  kovan: require('@0confirmation/sol/deployments/kovan/V2SwapAndDrop'),
  mainnet: require('@0confirmation/sol/deployments/live_1/V2SwapAndDrop')
};

const networkToEthereumNetwork = (n) => n === 'testnet' ? 'kovan' : n;

const chainIdFromNetwork = (network) => {
  switch (network) {
    case 'ganache':
      return '1337';
    case 'testnet':
      return 42;
    case 'mainnet':
      return 1;
  }
};

const fromArtifact = (network, artifact) => (artifact[networkToEthereumNetwork(network)] || {}).address || ethers.constants.AddressZero;

const renNetworkFromNetwork = (network) => {
  switch (network) {
    case 'testnet':
    case 'ganache':
      return 'testnet';
    case 'mainnet':
      return 'mainnet';
  }
  return network;
};

const renvmFromEnvironment = (network) => {
  if (network === 'ganache' || network === 'test') {
    return {
      shifterRegistry: '0x' + '00'.repeat(20),
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
    swapAndDrop: fromArtifact(network, V2SwapAndDrop)
  };
};

const uniswapFromNetwork = (network) => {
  if (network === 'testnet') return {
    factory: fromArtifact(network, UniswapV2Factory),
    router: fromArtifact(network, UniswapV2Router01)
  };
  return {
    factory: uniswap.FACTORY_ADDRESS,
    router: '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
  }
};

/*
const curveFromNetwork = (network) => ({
  curve: fromArtifact(network, Curvefi),
  curveToken: fromArtifact(network, CurveToken)
});
*/

const daiFromNetwork = (network) => {
  if (network === 'ganache') {
    return {
      dai: fromArtifact(network, DAI)
    };
  } else if (network === 'testnet') {
    return {
      dai: fromArtifact(network, DAI)
    };
  } else if (network === 'mainnet') {
    return {
      dai: '0x6b175474e89094c44da98b954eedeac495271d0f'
    };
  }
};

const wethFromNetwork = (network) => ({
  weth: (network === 'kovan' || network === 'testnet') ? fromArtifact(network, WETH9) : '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
});

const getAddresses = (network) => ({
 // ...curveFromNetwork(network),
  ...uniswapFromNetwork(network),
  ...zeroContractsFromNetwork(network),
  ...renvmFromEnvironment(network),
  ...daiFromNetwork(network),
  ...wethFromNetwork(network)
});

const getEnvironment = (provider, network, backends) => ({
  backends: backends || {
    ethereum: {
      provider
    },
    zero: {
      multiaddr: network === 'mainnet' ? 'zeronet' : 'lendnet',
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

const { makeManagerClass } = require('@0confirmation/eth-manager');

/*
const CurvefiManager = makeManagerClass(Curvefi);
*/
const ShifterPoolManager = makeManagerClass(ShifterPool.mainnet);
/*
const CurveTokenManager = makeManagerClass(CurveToken);
*/

Object.assign(module.exports, {
  getAddresses,
//  CurvefiManager,
  ShifterPoolManager,
//  CurveTokenManager,
  getEnvironment,
  getMockEnvironment
});

