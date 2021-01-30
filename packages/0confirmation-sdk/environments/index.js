'use strict';

const RenJS = require('../renvm');
const uniswap = require('@uniswap/sdk');
const ethers = require('ethers');
const randomBytes = require('random-bytes').sync;
const makeMockBackends = require('../mock');
const isBrowser = require('is-browser');
const requireMaybe = (s) => {
  try {
    return require(s);
  } catch (e) {
    return {};
  }
};
const ShifterPool = {
  kovan: require('@0confirmation/sol/deployments/kovan/ShifterPool'),
  mainnet: require('@0confirmation/sol/deployments/live/ShifterPool'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/ShifterPool')
};
const USDC = {
  buidler: requireMaybe('@0confirmation/sol/deployments/local_31337/USDC')
};
const UniswapV2Factory = {
  kovan: require('@0confirmation/sol/deployments/kovan/UniswapV2Factory'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/UniswapV2Factory')
};
const UniswapV2Router01 = {
  kovan: require('@0confirmation/sol/deployments/kovan/UniswapV2Router01'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/UniswapV2Router01')
};
const DAI = {
  kovan: require('@0confirmation/sol/deployments/kovan/DAI'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/DAI')
};
const WETH9 = {
  kovan: require('@0confirmation/sol/deployments/kovan/WETH9'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/WETH9')
};
const ShifterRegistryMock = {
  buidler: requireMaybe('@0confirmation/sol/deployments/local/ShifterRegistryMock')
};
//const SwapEntireLoan = require('@0confirmation/sol/deployments/kovan/SwapEntireLoan');

const TransferAll = {
  kovan: require('@0confirmation/sol/deployments/kovan/TransferAll'),
  mainnet: require('@0confirmation/sol/deployments/live/TransferAll'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/TransferAll')
};
const V2SwapAndDrop = {
  kovan: require('@0confirmation/sol/deployments/kovan/V2SwapAndDrop'),
  mainnet: require('@0confirmation/sol/deployments/live/V2SwapAndDrop'),
  buidler: requireMaybe('@0confirmation/sol/deployments/local/V2SwapAndDrop')
};

if (isBrowser) {
  ShifterPool.buidler = require('@0confirmation/sol/deployments/local/ShifterPool');
  UniswapV2Factory.buidler = require('@0confirmation/sol/deployments/local/UniswapV2Factory');
  UniswapV2Router01.buidler = require('@0confirmation/sol/deployments/local/UniswapV2Router01');
  DAI.buidler = require('@0confirmation/sol/deployments/local/DAI');
  WETH9.buidler = require('@0confirmation/sol/deployments/local/WETH9');
  ShifterRegistryMock.buidler = require('@0confirmation/sol/deployments/local/ShifterRegistryMock');
  V2SwapAndDrop.buidler = require('@0confirmation/sol/deployments/local/V2SwapAndDrop');
  TransferAll.buidler = require('@0confirmation/sol/deployments/local/TransferAll');
}

const networkToEthereumNetwork = (n) => n === 'testnet' ? 'kovan' : n;

const chainIdFromNetwork = (network) => {
  switch (network) {
    case 'buidler':
      return 31337;
    case 'testnet':
      return 42;
    case 'mainnet':
      return 1;
  }
};

const fromArtifact = (network, artifact) => (artifact[networkToEthereumNetwork(network)] || {}).address;

const renNetworkFromNetwork = (network) => {
  switch (network) {
    case 'testnet':
    case 'buidler':
      return 'testnet';
    case 'mainnet':
      return 'mainnet';
  }
  return network;
};

const renvmFromEnvironment = (network) => {
  if (network === 'buidler' || network === 'test') {
    return {
      shifterRegistry: fromArtifact(network, ShifterRegistryMock),
      mpkh: '0x' + randomBytes(20).toString('hex')
    }
  }
  const renvm = new RenJS(renNetworkFromNetwork(network));
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
    swapAndDrop: fromArtifact(network, V2SwapAndDrop),
    transferAll: fromArtifact(network, TransferAll)
  };
};

const uniswapFromNetwork = (network) => {
  if (network === 'testnet' || network === 'buidler') return {
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

const usdcFromNetwork = (network) => {
  if (network === 'buidler') {
    return {
      usdc: fromArtifact(network, USDC)
    };
  } else if (network === 'mainnet') {
    return {
      usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    };
  } else {
    return {
      usdc: ethers.constants.AddressZero
    };
  }
};

const daiFromNetwork = (network) => {
  if (network === 'buidler') {
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
  weth: (network === 'kovan' || network === 'testnet' || network === 'buidler') ? fromArtifact(network, WETH9) : '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
});

const getAddresses = (network) => ({
 // ...curveFromNetwork(network),
  ...uniswapFromNetwork(network),
  ...zeroContractsFromNetwork(network),
  ...renvmFromEnvironment(network),
  ...daiFromNetwork(network),
  ...wethFromNetwork(network),
  ...usdcFromNetwork(network)
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

const getMockEnvironment = (provider) => getEnvironment(provider, 'buidler', makeMockBackends(provider));


const { makeEthersBase } = require('ethers-base');
/*
const CurvefiManager = makeEthersBase(Curvefi);
*/
const ShifterPoolManager = makeEthersBase(ShifterPool.mainnet);
/*
const CurveTokenManager = makeEthersBase(CurveToken);
*/

Object.assign(module.exports, {
  getAddresses,
//  CurvefiManager,
  ShifterPoolManager,
//  CurveTokenManager,
  getEnvironment,
  getMockEnvironment
});

