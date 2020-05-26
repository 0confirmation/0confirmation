'use strict';

/* eslint import/no-webpack-loader-syntax: off */

const globalObject = require('the-global-object');
const fromEthers = require('@0confirmation/providers/from-ethers');
const {
  makeEngine,
  makeBaseProvider
} = require('@0confirmation/providers');
const url = require('url');
const makeWalletSelectorFromProvider = require('@0confirmation/providers/selector');

const Migrations = require('@0confirmation/sol/build/Migrations');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const SandboxLib = require('@0confirmation/sol/build/SandboxLib');
const SimpleBurnLiquidationModule = require('@0confirmation/sol/build/SimpleBurnLiquidationModule');
const ShifterERC20Mock = require('@0confirmation/sol/build/ShifterERC20Mock');
const ERC20Adapter = require('@0confirmation/sol/build/ERC20Adapter');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const CurveAdapter = require('@0confirmation/sol/build/CurveAdapter');
const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const ShifterBorrowProxyFactoryLib = require('@0confirmation/sol/build/ShifterBorrowProxyFactoryLib');
const Curvefi = require('@0confirmation/sol/build/Curvefi');
const CurveToken = require('@0confirmation/sol/build/CurveToken');
const DAI = require('@0confirmation/sol/build/DAI');
const WBTC = require('@0confirmation/sol/build/WBTC');
const Exchange = require('@0confirmation/sol/build/Exchange');
const Factory = require('@0confirmation/sol/build/Factory');
const UniswapV2Router01 = require('@0confirmation/sol/build/UniswapV2Router01');
const UniswapV2Factory = require('@0confirmation/sol/build/UniswapV2Factory');

const UniswapV2Adapter = require('@0confirmation/sol/build/UniswapV2Adapter');
const V2SwapAndDrop = require('@0confirmation/sol/build/V2SwapAndDrop');
const WETH9 = require('@0confirmation/sol/build/WETH9');

const ethers = require('ethers');
const environments = require('@0confirmation/sdk/environments');
const fs = require('fs');
const Zero = require('@0confirmation/sdk');
const { ZeroMock } = Zero;

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};

const CHAIN = process.env.CHAIN || process.env.REACT_APP_CHAIN;

const NO_SUBMODULE = '0x' + Array(40).fill('0').join('');


const makeArtifacts = require('@0confirmation/artifacts');
const migrationSource = globalObject.document && require('raw-loader!@0confirmation/sol/migrations/1_initial_migration').default || require('fs').readFileSync(require.resolve('@0confirmation/sol/migrations/1_initial_migration'), 'utf8');

const defer = () => {
  let promise, resolve, reject;
  promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  }
};


const builds = {
  Migrations,
  ShifterPool,
  SandboxLib,
  V2SwapAndDrop,
  UniswapV2Adapter,
  UniswapV2Factory,
  UniswapV2Router01,
  SimpleBurnLiquidationModule,
  ShifterERC20Mock,
  ERC20Adapter,
  LiquidityToken,
  CurveAdapter,
  ShifterRegistryMock,
  ShifterBorrowProxyFactoryLib,
  Curvefi,
  CurveToken,
  DAI,
  WBTC,
  WETH9,
  Exchange,
  Factory,
};

let makeGanacheProvider = () => fromEthers(new ethers.providers.JsonRpcProvider('http://localhost:8545')), setupEmbeddedMocks = () => Promise.resolve();
if (CHAIN === 'embedded' || CHAIN === 'test') {
  makeGanacheProvider = CHAIN === 'test' ? () => fromEthers(new ethers.providers.JsonRpcProvider(process.env.REACT_APP_GANACHE_URI || 'http://localhost:8545')) : require('@0confirmation/browser-ganache');
  setupEmbeddedMocks = async function () {
    const provider = this;
    const setupProvider = makeWalletSelectorFromProvider(provider.dataProvider, 2);
    if (provider._initialized) return await provider._initialized;
    const deferred = defer();
    provider._initialized = deferred.promise;
    const artifacts = makeArtifacts(setupProvider, builds);
    await artifacts.runMigration(migrationSource, {
      ethers,
      bluebird: require('bluebird'),
      fs: {},
      '@0confirmation/sdk/environments': require('@0confirmation/sdk/environments'),
      '@0confirmation/sdk': require('@0confirmation/sdk'),
      console
    });
    window.alert('0confirmation: demo environment bootstrapped');
    return artifacts;
  };
}

const engine = makeEngine();
const provider = engine.asProvider();
engine.push(async (req, res, next, end) => {
  try {
    if ([
      'eth_sendTransaction',
      'eth_sign',
      'eth_signTypedData',
      'personal_sign',
      'eth_accounts'
    ].includes(req.method)) {
      if (req.method !== 'eth_accounts' && provider.signingProvider.enable) await provider.signingProvider.enable();
      if (req.method === 'eth_sendTransaction') await provider.signingProviderTargetsCorrectChainOrThrow();
      res.result = await (provider.signingProvider.asEthers()).send(req.method, req.params);
    } else {
      res.result = await (provider.dataProvider.asEthers()).send(req.method, req.params);
    }
  } catch (e) {
    res.error = e;
  }
  end();
});

const chainToProvider = (chainId) => {
  switch (chainId) {
    case '1':
      return fromEthers(new ethers.providers.InfuraProvider('mainnet'));
    case '42':
      return fromEthers(new ethers.providers.InfuraProvider('kovan'));
    case 'embedded':
    default:
      return makeGanacheProvider();
  }
};

provider.setSigningProvider = (signingProvider) => {
  provider.signingProvider = makeBaseProvider(signingProvider);
  if (signingProvider.enable) provider.signingProvider.enable = signingProvider.enable.bind(signingProvider);
};

provider.signingProviderTargetsCorrectChainOrThrow = async () => {
  const signingProviderChainId = Number(await (provider.signingProvider.asEthers()).send('net_version', []));
  const dataProviderChainId = Number(await (provider.dataProvider.asEthers()).send('net_version', []));
  if (signingProviderChainId !== dataProviderChainId) throw Error('Your wallet does not point to network ID: ' + String(dataProviderChainId) + ', select the correct network');
};

provider.dataProvider = chainToProvider(CHAIN);

const getMemo = (v) => {
  const memo = v.sendAsync.memo;
  delete v.sendAsync.memo;
  return memo;
};

const makeFauxMetamaskSigner = (realProvider, metamask) => {
  const engine = makeEngine();
  const provider = engine.asProvider();
  if (metamask.enable) provider.enable = metamask.enable.bind(metamask);
  engine.push(async (req, res, next, end) => {
    if (req.method === 'eth_sendTransaction' || req.method === 'personal_sign') {
      const memo = getMemo(metamask);
      await new Promise((resolve, reject) => metamask.send({
        method: 'personal_sign',
        params: [ metamask.selectedAddress, ethers.utils.hexlify(ethers.utils.toUtf8Bytes('0confirmation test transaction simulation' + (memo ? ': ' + memo : ''))) ],
        id: Number((Math.random() * 10000).toFixed(0))
      }, (err, result) => err ? reject(err) : resolve()));
    }
    next();
  });
  engine.push(realProvider.asMiddleware());
  return provider;
};

if (globalObject.ethereum) {
  if (CHAIN === 'embedded' || CHAIN === 'external') provider.setSigningProvider(makeFauxMetamaskSigner(provider.dataProvider, globalObject.ethereum));
  else provider.setSigningProvider(globalObject.ethereum);
}
else provider.signingProvider = provider.dataProvider;
provider.migrate = setupEmbeddedMocks;
if (CHAIN === 'embedded') globalObject.provider = provider;

provider.builds = builds;
provider.makeFauxMetamaskSigner = makeFauxMetamaskSigner;
export default provider;
