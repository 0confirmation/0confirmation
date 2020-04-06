'use strict';

const crypto = require('crypto');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const bip39 = require('bip39');
const mnemonic = process.env.MNEMONIC || bip39.generateMnemonic();
const ShifterBorrowProxy = require('@0confirmation/sol/build/ShifterBorrowProxy');
const seed = bip39.mnemonicToSeed(mnemonic);
const hdkey = require('ethereumjs-wallet/hdkey');
const hdwallet = hdkey.fromMasterSeed(seed);
const { promisify } = require('bluebird');
const privateKeys = Array(10).fill(null).map((_, i) => hdwallet.derivePath("m/44'/60'/0'/0/" + String(i)).getWallet().getPrivateKeyString());

const startSignalingServer = require('@0confirmation/webrtc-star');

const timeout = (n) => new Promise((resolve) => setTimeout(resolve, n));

const resultToJsonRpc = require('../lib/util/result-to-jsonrpc');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache-cli');
const key = privateKeys[0].substr(2);
const ganacheInstance = process.env.EXTERNAL_GANACHE ? 'http://localhost:8545' : ganache.provider({
  mnemonic,
  gasLimit: '100000000'
});
const provider = new HDWalletProvider(key, ganacheInstance);
provider._key = key;
const borrowerProvider = new HDWalletProvider(privateKeys[1].substr(2), ganacheInstance);
borrowerProvider._key = privateKeys[1].substr(2);
const ethers = require('ethers');
const { utils } = ethers;
const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};
[ provider, borrowerProvider ].forEach((p) => {
  p.send = promisify(p.send, { context: p });
  const { send } = p;
  p.send = (o, ...args) => {
    if (o.method === 'personal_sign') {
      const wallet = new ethers.Wallet('0x' + p._key);
      return {
        jsonrpc: '2.0',
        id: o.id,
        result: wallet.signMessage(ethers.utils.arrayify(o.params[0]))
      };
    }
    else return send.call(p, o, ...args);
  };
});

const ethersProvider = new Web3Provider(provider);

const Zero = require('../lib/sdk');

const fs = require('fs-extra');

const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const UniswapAdapter = require('@0confirmation/sol/build/UniswapAdapter');
const SimpleBurnLiquidationModule = require('@0confirmation/sol/build/SimpleBurnLiquidationModule');
const Absorb = require('@0confirmation/sol/build/Absorb');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterERC20 = require('@0confirmation/sol/build/ShifterERC20Mock');
const ERC20Adapter = require('@0confirmation/sol/build/ERC20Adapter');
const { linkBytecode: link } = require('solc/linker');

const getFactory = (artifact, linkReferences) => new ethers.ContractFactory(artifact.abi, linkReferences ? link(artifact.bytecode, linkReferences) : artifact.bytecode, ethersProvider.getSigner());

const Factory = {
  abi: require('contracts-vyper/abi/uniswap_factory'),
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/factory.txt'), 'utf8').trim()
};

const Exchange = {
  abi: require('contracts-vyper/abi/uniswap_exchange'),
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/exchange.txt'), 'utf8').trim()
};

const createMarket = async (provider, factory, token) => {
  const factoryWrapped = new ethers.Contract(factory, Factory.abi, provider.getSigner());
  const receipt = await (await factoryWrapped.createExchange(token, { gasLimit: ethers.utils.hexlify(6e6) })).wait();
  const { logs } = receipt;
  const exchange = '0x' + logs[0].topics[2].substr(26);
  const tokenWrapped = new ethers.Contract(token, LiquidityToken.abi, provider.getSigner());
  await (await tokenWrapped.approve(exchange, utils.parseUnits('500', 8))).wait();
  const exchangeWrapped = new ethers.Contract(exchange, Exchange.abi, provider.getSigner());
  await (await exchangeWrapped.addLiquidity(utils.parseEther('10'), utils.parseUnits('100', 8), String(Date.now() * 2), {
    value: utils.hexlify(utils.parseEther('10')),
    gasLimit: ethers.utils.hexlify(6e6)
  })).wait();
  return exchange;
};

const uniq = require('lodash/uniq');

const deploy = async () => {
  const borrowProxyLibFactory = getFactory(BorrowProxyLib);
  const { address: borrowProxyLib } = await borrowProxyLibFactory.deploy();
  const shifterPoolFactory = getFactory(ShifterPool, { BorrowProxyLib: borrowProxyLib });
  const shifterPoolContract = await shifterPoolFactory.deploy();
  const { address: shifterPool } = shifterPoolContract;
  const shifterMockFactory = getFactory(ShifterRegistryMock);
  const shifterMockContract = await shifterMockFactory.deploy();
  const zbtc = await shifterMockContract.token();
  const { address: shifterMock } = shifterMockContract;
  const factoryFactory = getFactory(Factory);
  const factoryContract = await factoryFactory.deploy();
  const { address: factory } = factoryContract;
  const exchangeFactory = getFactory(Exchange);
  const { address: exchange } = await exchangeFactory.deploy();
  await (await factoryContract.initializeFactory(exchange)).wait();
  const uniswapAdapterFactory = getFactory(UniswapAdapter);
  const simpleBurnLiquidationModuleFactory = getFactory(SimpleBurnLiquidationModule);
  const erc20AdapterFactory = getFactory(ERC20Adapter);
  const { address: erc20Adapter } = await erc20AdapterFactory.deploy();
  const { address: uniswapAdapter } = await uniswapAdapterFactory.deploy(factory);
  const { address: simpleBurnLiquidationModule } = await simpleBurnLiquidationModuleFactory.deploy(factory, zbtc);
  const liquidityTokenFactory = getFactory(LiquidityToken);
  const zbtcContract = new ethers.Contract(zbtc, ShifterERC20.abi, ethersProvider.getSigner());
  const [ keeperAddress ] = await ethersProvider.send('eth_accounts', []);
  await (await zbtcContract.mint(keeperAddress, utils.parseUnits('1000', 8).toString())).wait();
  const zbtcExchange = await createMarket(ethersProvider, factory, zbtc);
  const { address: zerobtc } = await liquidityTokenFactory.deploy(shifterPool, zbtc, 'zeroBTC', 'zeroBTC');
  const absorbFactory = getFactory(Absorb);
  const { address: absorb } = await absorbFactory.deploy();
  await ethersProvider.waitForTransaction((await shifterPoolContract.setup(shifterMock, '1000', '1', [{
    moduleType: ModuleTypes.BY_CODEHASH,
    target: zbtcExchange,
    sigs: Zero.getSignatures(Exchange.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: uniswapAdapter,
      repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
      liquidationSubmodule: simpleBurnLiquidationModule
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: zbtc,
    sigs: Zero.getSignatures(LiquidityToken.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: erc20Adapter,
      repaymentSubmodule: erc20Adapter,
      liquidationSubmodule: '0x' + Array(40).fill('0').join('')
    }
  }, {
    moduleType: ModuleTypes.BY_ADDRESS,
    target: '0x' + Array(39).fill('0').join('') + '1',
    sigs: Zero.getSignatures(Absorb.abi),
    module: {
      isPrecompiled: true,
      assetSubmodule: absorb,
      repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
      liquidationSubmodule: simpleBurnLiquidationModule
    }
  }],
  [{
    token: zbtc,
    liqToken: zerobtc
  }])).hash);
  return {
    mpkh: '0x' + crypto.randomBytes(32).toString('hex'),
    borrowProxyLib,
    shifterPool,
    zbtc,
    shifterMock,
    factory,
    exchange: zbtcExchange,
    uniswapAdapter
  };
};

const RPCWrapper = require('../lib/util/rpc-wrapper');

const mockBtcBackend = {
  name: 'btc',
  prefixes: ['btc'],
  async send({
    method,
    params,
    id
  }) {
    return await resultToJsonRpc(id, () => [{
      output_no: 1,
      txid: crypto.randomBytes(32).toString('hex')
    }]);
  }
};

mockBtcBackend.__proto__ = RPCWrapper.prototype;

const mockRenVMBackend = {
  name: 'renvm',
  prefixes: ['ren'],
  async send({
    method,
    params,
    id
  }) {
    if (method === 'ren_submitTx') return resultToJsonRpc(id, () => ({}));
    else if (method === 'ren_queryTx') return resultToJsonRpc(id, () => ({
      tx: {
        out: [{
          value: '0x' + crypto.randomBytes(32).toString('hex')
        }, {
          value: '0x' + crypto.randomBytes(32).toString('hex')
        }, {
          value: 27
        }]
      }
    }));
    return {};
  }
};

mockRenVMBackend.__proto__ = RPCWrapper.prototype;

const makeZero = async (contracts, provider) => {
  const zero = new Zero({
    backends: {
      ethereum: {
        provider
      },
      btc: {
        network: 'testnet'
      },
      renvm: {
        network: 'testnet'
      },
      zero: {
        multiaddr: '/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/',
        dht: true
      }
    },
    shifterPool: contracts.shifterPool,
    mpkh: contracts.mpkh,
    borrowProxyLib: contracts.borrowProxyLib
  });
  zero.driver.registerBackend(Object.assign(Object.create(mockBtcBackend), {
    driver: zero.driver
  }));
  zero.driver.registerBackend(Object.assign(Object.create(mockRenVMBackend), {
    driver: zero.driver
  }));
  await zero.initializeDriver();
  await timeout(5000);
  return zero;
};

const defer = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
};

const nodeUtil = require('util');

const ln = (v, desc) => ((console.log(desc + ': ')), (console.log(nodeUtil.inspect(v, { colors: true, depth: 3 }))), v);

describe('0confirmation sdk', () => {
  before(async () => {
    await startSignalingServer();
  });
  it('should execute a borrow', async () => {
    const contracts = await deploy();
    const borrower = await makeZero(contracts, borrowerProvider);
    const keeper = await makeZero(contracts, provider);
    const deferred = defer();
    await (await keeper.approveLiquidityToken(contracts.zbtc)).wait();
    const exchange = contracts.exchange;
    await (await keeper.addLiquidity(contracts.zbtc, utils.parseUnits('5', 8).toString())).wait();
    await (await keeper.approvePool(contracts.zbtc)).wait();
    await keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit();
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
        await deposited.executeBorrow(utils.parseUnits('1', 8).toString(), '100000');
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
//  const subscribeDeferred = defer();
//  keeper.subscribeBorrows([], (v) => subscribeDeferred.resolve(v));
    const liquidityRequest = borrower.createLiquidityRequest({
      token: contracts.zbtc,
      amount: utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cd',
      gasRequested: utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    await timeout(2000);
    await liquidityRequestParcel.broadcast();
    const proxy = await deferred.promise;
    await borrower.driver.sendWrapped('0cf_setBorrowProxy', [ (liquidityRequestParcel.proxyAddress) ]);
    const borrowedProvider = new Web3Provider(borrower.getProvider());
    const exchangeWrapped = new ethers.Contract(contracts.exchange, Exchange.abi, borrowedProvider.getSigner());
    console.log('almost');
    console.log(require('util').inspect(await (await exchangeWrapped.tokenToEthTransferInput(utils.parseUnits('1', 8), utils.parseUnits('1', 8), String(Date.now() * 2), liquidityRequestParcel.proxyAddress, { gasLimit: ethers.utils.hexlify(6e6) })).wait(), { colors: true, depth: 15 }));
    console.log('done');
    await (await proxy.defaultLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
  });
});
