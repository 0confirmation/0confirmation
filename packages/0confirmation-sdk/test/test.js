'use strict';

const crypto = require('crypto');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const bip39 = require('bip39');
const mnemonic = process.env.MNEMONIC || bip39.generateMnemonic();
const seed = bip39.mnemonicToSeed(mnemonic);
const hdkey = require('ethereumjs-wallet/hdkey');
const hdwallet = hdkey.fromMasterSeed(seed);
const { promisify } = require('bluebird');
const privateKeys = Array(10).fill(null).map((_, i) => hdwallet.derivePath("m/44'/60'/0'/0/" + String(i)).getWallet().getPrivateKeyString());

const timeout = (n) => new Promise((resolve) => setTimeout(resolve, n));

const resultToJsonRpc = require('../lib/util/result-to-jsonrpc');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache-cli');
const key = privateKeys[0].substr(2);
const provider = new HDWalletProvider(key, process.env.EXTERNAL_GANACHE ? 'http://localhost:8545' : ganache.provider({
  mnemonic
}));
provider._key = key;
const borrowerProvider = new HDWalletProvider(privateKeys[1].substr(2), process.env.EXTERNAL_GANACHE ? 'http://localhost:8545' : ganache.provider({
  mnemonic
}));
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
        result: wallet.signMessage(o.params[0])
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
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterERC20 = require('@0confirmation/sol/build/ShifterERC20Mock');
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
  const { address: factory } = await factoryFactory.deploy();
  const exchangeFactory = getFactory(Exchange);
  const { address: exchange } = await exchangeFactory.deploy();
  const uniswapAdapterFactory = getFactory(UniswapAdapter);
  const simpleBurnLiquidationModuleFactory = getFactory(SimpleBurnLiquidationModule);
  const { address: uniswapAdapter } = await uniswapAdapterFactory.deploy(factory);
  const { address: simpleBurnLiquidationModule } = await simpleBurnLiquidationModuleFactory.deploy(factory, zbtc);
  const liquidityTokenFactory = getFactory(LiquidityToken);
  const { address: zerobtc } = await liquidityTokenFactory.deploy(zbtc, 'zeroBTC', 'zeroBTC');
  await ethersProvider.waitForTransaction((await shifterPoolContract.setup(shifterMock, '1000', [{
    moduleType: ModuleTypes.BY_CODEHASH,
    target: exchange,
    sigs: [
      '0x89f2a871',
      '0xfd11c223',
      '0x95e3c50b',
      '0x013efd8b',
      '0xcd7724c3',
      '0x59e94862',
      '0x95b68fe7',
      '0x2640f62c',
      '0x9d76ea58',
      '0x422f1043',
      '0xf88bf15a',
      '0xf39b5b9b',
      '0xad65d76d',
      '0x6b1d4db7',
      '0x0b573638',
      '0x7237e031',
      '0xd4e4841d',
      '0xddf7e1a7',
      '0xf552d91b',
      '0xb040d545',
      '0xf3c0efe9',
      '0xb1cb43bf',
      '0xec384a3e',
      '0xea650c7d',
      '0x981a1327'
    ],
    module: {
      assetHandler: uniswapAdapter,
      liquidationModule: simpleBurnLiquidationModule
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
    exchange,
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
        multiaddr: 'lendnet',
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
  console.log('waiting for peer bootstrap')
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
  it('should execute a borrow', async () => {
    const contracts = await deploy();
    const borrower = await makeZero(contracts, borrowerProvider);
    const keeper = await makeZero(contracts, provider);
    const deferred = defer();
    const [ keeperAddress ] = await keeper.driver.sendWrapped('eth_accounts', []);
    const zbtcContract = new ethers.Contract(contracts.zbtc, ShifterERC20.abi, ethersProvider.getSigner());
    await ethersProvider.waitForTransaction((await zbtcContract.mint(keeperAddress, utils.parseUnits('1000', 8).toString())).hash);
    console.log('woop');
    await ethersProvider.waitForTransaction((await keeper.approveLiquidityToken(contracts.zbtc)).hash);
    console.log('woop');
    await ethersProvider.waitForTransaction((await keeper.addLiquidity(contracts.zbtc, utils.parseUnits('500', 8).toString())).hash);
    console.log('woop');
    await ethersProvider.waitForTransaction((await keeper.approvePool(contracts.zbtc)).hash);
    console.log('woop');
    await keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit();
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      await v.executeBorrow(utils.parseUnits('0.0005', 8).toString(), '1000');
      console.log('executed');
    });
    const liquidityRequest = borrower.createLiquidityRequest({
      token: contracts.zbtc,
      amount: utils.parseUnits('0.001', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cd',
      gasRequested: utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    await timeout(5000);
    await liquidityRequestParcel.broadcast();
  });
});
