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
const borrowerProvider = new HDWalletProvider(require('crypto').randomBytes(32).toString('hex'), ganacheInstance)
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
const shifterPoolInterface = new ethers.utils.Interface(ShifterPool.abi.concat(BorrowProxyLib.abi));
const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const UniswapAdapter = require('@0confirmation/sol/build/UniswapAdapter');
const UniswapTradeAbsorb = require('@0confirmation/sol/build/UniswapTradeAbsorb');
const SimpleBurnLiquidationModule = require('@0confirmation/sol/build/SimpleBurnLiquidationModule');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterERC20 = require('@0confirmation/sol/build/ShifterERC20Mock');
const ERC20Adapter = require('@0confirmation/sol/build/ERC20Adapter');
const { linkBytecode: link } = require('solc/linker');
const filterABI = (abi) => abi.filter((v) => v.type !== 'receive');
const getFactory = (artifact, linkReferences) => new ethers.ContractFactory(filterABI(artifact.abi), linkReferences ? link(artifact.bytecode, linkReferences) : artifact.bytecode, ethersProvider.getSigner());

const Factory = {
  abi: require('contracts-vyper/abi/uniswap_factory'),
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/factory.txt'), 'utf8').trim()
};

const Exchange = {
  abi: require('contracts-vyper/abi/uniswap_exchange'),
  bytecode: fs.readFileSync(require.resolve('contracts-vyper/bytecode/exchange.txt'), 'utf8').trim()
};

const createMarket = async (provider, factory, token, tokens = '10') => {
  const factoryWrapped = new ethers.Contract(factory, filterABI(Factory.abi), provider.getSigner());
  const receipt = await (await factoryWrapped.createExchange(token, { gasLimit: ethers.utils.hexlify(6e6) })).wait();
  const { logs } = receipt;
  const exchange = '0x' + logs[0].topics[2].substr(26);
  const tokenWrapped = new ethers.Contract(token, filterABI(LiquidityToken.abi), provider.getSigner());
  await (await tokenWrapped.approve(exchange, utils.parseUnits(tokens, 8))).wait();
  const exchangeWrapped = new ethers.Contract(exchange, filterABI(Exchange.abi), provider.getSigner());
  await (await exchangeWrapped.addLiquidity(utils.parseEther('10'), utils.parseUnits(tokens, 8), String(Date.now() * 2), {
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
  const { address: simpleBurnLiquidationModule } = await simpleBurnLiquidationModuleFactory.deploy(factory);
  const liquidityTokenFactory = getFactory(LiquidityToken);
  const daiFactory = getFactory(ShifterERC20);
  const { address: dai } = await daiFactory.deploy();
  const zbtcContract = new ethers.Contract(zbtc, filterABI(ShifterERC20.abi), ethersProvider.getSigner());
  const daiContract = new ethers.Contract(dai, filterABI(ShifterERC20.abi), ethersProvider.getSigner());
  const [ keeperAddress ] = await ethersProvider.send('eth_accounts', []);
  await (await zbtcContract.mint(keeperAddress, utils.parseUnits('100000', 8).toString())).wait();
  await (await daiContract.mint(keeperAddress, utils.parseUnits('100000', 8).toString())).wait();
  const zbtcExchange = await createMarket(ethersProvider, factory, zbtc);
  const daiExchange = await createMarket(ethersProvider, factory, dai, '73549.42');
  const { address: zerobtc } = await liquidityTokenFactory.deploy(shifterPool, zbtc, 'zeroBTC', 'zeroBTC', 8);
  await ethersProvider.waitForTransaction((await shifterPoolContract.setup(shifterMock, '1000', ethers.utils.parseEther('0.01'), [{
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
    target: dai,
    sigs: Zero.getSignatures(LiquidityToken.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: erc20Adapter,
      repaymentSubmodule: erc20Adapter,
      liquidationSubmodule: '0x' + Array(40).fill('0').join('')
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
    dai,
    daiExchange,
    zerobtc,
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

const chalk = require('chalk');

console.logBold = (v) => console.log(chalk.bold(v));

const getTokenBalance = async (from, token, decimals) => {
  const contract = new ethers.Contract(token, filterABI(LiquidityToken.abi), ethersProvider.getSigner());
  return ethers.utils.formatUnits(await contract.balanceOf(from), decimals);
};

const logSheet = async (from, name, contracts) => {
  const eth = Number(await ethersProvider.send('eth_getBalance', [ from, 'latest' ]));
  const token = Number(await getTokenBalance(from, contracts.zbtc, 8));
  const dai = Number(await getTokenBalance(from, contracts.dai, 8));
  console.log(chalk.cyan('=== ' + chalk.bold(name)));
  console.log(chalk.cyan('=== ' + chalk.yellow(from)));
  console.log(chalk.cyan('=== balances:'));
  if (eth) console.log(chalk.cyan('=== ETH: ') + chalk.bold(chalk.yellow(ethers.utils.formatEther(await ethersProvider.send('eth_getBalance', [ from, 'latest' ])))));
  if (token) console.log(chalk.cyan('=== renBTC: ') + chalk.bold(chalk.yellow(await getTokenBalance(from, contracts.zbtc, 8))));
  if (dai) console.log(chalk.cyan('=== dai: ') + chalk.bold(chalk.yellow(await getTokenBalance(from, contracts.dai, 8))));
  console.log(chalk.cyan('=============='));
  console.log();
};

const logLiquidityRequest = (v) => {
  console.logBold('=== liquidity request');
  console.logBold('=== token: ' + chalk.magenta(v.token));
  console.logBold('=== amount: ' + chalk.yellow(utils.formatUnits(v.amount, 8)));
  console.logBold('=== nonce: ' + chalk.red(v.nonce));
  console.logBold('=== gas requested: ' + chalk.yellow(utils.formatEther(v.gasRequested)));
  console.log();
};

describe('0confirmation sdk', () => {
  const fixtures = {};
  before(async () => {
    await startSignalingServer();
    fixtures.contracts = await deploy();
    const [ borrower, keeper ] = await Promise.all([
      makeZero(fixtures.contracts, borrowerProvider),
      makeZero(fixtures.contracts, provider)
    ]);
    Object.assign(fixtures, {
      borrower,
      keeper
    });
    await (await fixtures.keeper.approveLiquidityToken(fixtures.contracts.zbtc)).wait();
    await (await fixtures.keeper.addLiquidity(fixtures.contracts.zbtc, utils.parseUnits('5', 8).toString())).wait();
    await (await fixtures.keeper.approvePool(fixtures.contracts.zbtc)).wait();
  });
/*
  it('should execute a borrow', async () => {
    const deferred = defer();
    const exchange = fixtures.contracts.exchange;
    const [ keeperAddress ] = await fixtures.keeper.driver.sendWrapped('eth_accounts', []);
    const [ borrowerAddress ] = await fixtures.borrower.driver.sendWrapped('eth_accounts', []);
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit();
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      console.log('broadcasted!');
      await logSheet(borrowerAddress, 'borrower before borrow', fixtures.contracts);
      await logSheet(keeperAddress, 'keeper before borrow', fixtures.contracts);
      await logSheet(fixtures.contracts.shifterPool, 'shifter pool before borrow', fixtures.contracts);
      await logSheet(fixtures.contracts.zerobtc, 'renBTC pool before borrow', fixtures.contracts);
      try {
        await deposited.executeBorrow(utils.parseUnits('1', 8).toString(), '100000');
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
    console.log('keeper address: ' + keeperAddress);
    console.log('borrower address: ' + borrowerAddress);
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.contracts.zbtc,
      amount: utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16ce',
      actions: [],
      gasRequested: utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    console.log('liquidity request signed by fixtures.borrower: ' + liquidityRequestParcel.signature);
    await timeout(2000);
    await liquidityRequestParcel.broadcast();
    const proxy = await deferred.promise;
    await logSheet(borrowerAddress, 'fixtures.borrower after borrow', fixtures.contracts);
    await logSheet(keeperAddress, 'keeper after borrow', fixtures.contracts);
    await logSheet(fixtures.contracts.shifterPool, 'shifter pool after borrow', fixtures.contracts);
    await logSheet(fixtures.contracts.zerobtc, 'renBTC pool after borrow', fixtures.contracts);
    await logSheet(liquidityRequestParcel.proxyAddress, 'borrow proxy after borrow', fixtures.contracts);
    await fixtures.borrower.setBorrowProxy(liquidityRequestParcel.proxyAddress);
    const borrowedProvider = new Web3Provider(fixtures.borrower.getProvider());
    const exchangeWrapped = new ethers.Contract(fixtures.contracts.exchange, Exchange.abi, borrowedProvider.getSigner());
    console.log(chalk.bold('dumping loan on uniswap ...'));
    await (await exchangeWrapped.tokenToEthSwapInput(utils.parseUnits('1', 8), utils.parseUnits('1', 8), String(Date.now() * 2), { gasLimit: ethers.utils.hexlify(6e6) })).wait();
    await logSheet(liquidityRequestParcel.proxyAddress, 'borrow proxy after trade on uniswap', fixtures.contracts);
    await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    await logSheet(keeperAddress, 'keeper after repayment', fixtures.contracts);
    await logSheet(fixtures.contracts.zerobtc, 'renBTC pool after repayment', fixtures.contracts);
    await fixtures.keeper.stopListeningForLiquidityRequests();
  });
*/
  it('should execute a payment', async () => {
    const deferred = defer();
    console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);
    const exchange = fixtures.contracts.exchange;
    const [ keeperAddress ] = await fixtures.keeper.driver.sendWrapped('eth_accounts', []);
    const [ borrowerAddress ] = await fixtures.borrower.driver.sendWrapped('eth_accounts', []);
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      console.logBold('broadcasted liquidity request over libp2p!');
      console.logKeeper('got liquidity request!');
      console.logKeeper('computing BTC address from liquidity request parameters: ' + chalk.cyan(v.depositAddress));
      console.logKeeper('OK! ' + chalk.yellow(v.proxyAddress) + ' is a borrow proxy derived from a deposit of ' + ethers.utils.formatUnits(v.amount, 8) + ' BTC at the target address');
      const deposited = await v.waitForDeposit();
      console.logKeeper('BTC found at target address! signaling RenVM and creating borrow proxy on Ethereum with funds available --');
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      await logSheet(fixtures.contracts.zerobtc, 'renBTC pool before borrow', fixtures.contracts);
      try {
        const receipt = await (await deposited.executeBorrow(utils.parseUnits('1', 8).toString(), '100000')).wait();
        console.log(require('util').inspect(receipt.logs.map((v) => shifterPoolInterface.parseLog(v)), { colors: true, depth: 150 }));;
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
    console.logBold('keeper address: ' + chalk.cyan(keeperAddress) + ' -- ready to bond over liquidity');
    console.logBold('borrower address: ' + chalk.cyan(borrowerAddress));
    console.log();
    const TRANSFER_TARGET = '0x' + Array(40).fill('1').join('');
    const actions = [{
      to: fixtures.contracts.exchange,
      calldata: (new ethers.utils.Interface(filterABI(Exchange.abi))).functions.tokenToTokenSwapInput.encode([ utils.parseUnits('1.97', 8), '1', '1', String(Date.now() * 2), fixtures.contracts.dai ])
    }, Zero.preprocessor(UniswapTradeAbsorb, borrowerAddress)];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.contracts.zbtc,
      amount: utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cf',
      actions,
      gasRequested: utils.parseEther('0.01').toString()
    });
    logLiquidityRequest(liquidityRequest);
    const liquidityRequestParcel = await liquidityRequest.sign();
    console.logBold('computed borrow proxy address from liquidity request parameters: ' + chalk.cyan(liquidityRequestParcel.proxyAddress));
    console.logBold('computed BTC deposit address to initiate RenVM shift: ' + chalk.cyan(liquidityRequestParcel.depositAddress));
    console.log();
    console.logBold('liquidity request signed by borrower: ' + chalk.cyan(liquidityRequestParcel.signature));
    console.log();
    console.logBold('borrow proxy init transactions signed with message: ');
    console.logBold(' 1) sell on uniswap for DAI (Exhange#tokenToTokenSwapInput): ' + chalk.cyan(liquidityRequest.actions[0].calldata));
    console.logBold(' 2) transfer DAI to final destination (' + chalk.cyan(TRANSFER_TARGET) + '), delayed until repayment event from RenVM (ERC20#transfer): ' + chalk.cyan(liquidityRequest.actions[1].calldata));
    console.log();
    await timeout(2000);
    await liquidityRequestParcel.broadcast();
    const proxy = await deferred.promise;
    console.logBold('- borrow proxy created with ' + chalk.yellow('1.97 renBTC') + ' and initialization actions processed -- 0 remaining!');
    await logSheet(fixtures.contracts.zerobtc, 'renBTC pool after borrow', fixtures.contracts);
    console.logBold('keeper and pool fees reserved, awaiting repayment!')
    await fixtures.borrower.setBorrowProxy(liquidityRequestParcel.proxyAddress);
    const borrowedProvider = new Web3Provider(fixtures.borrower.getProvider());
    const exchangeWrapped = new ethers.Contract(fixtures.contracts.exchange, filterABI(Exchange.abi), borrowedProvider.getSigner());
    console.logBold('repaying loan via a RenVM shift message!');
    await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    await logSheet(fixtures.contracts.zerobtc, 'renBTC pool after repayment', fixtures.contracts);
    await logSheet(borrowerAddress, 'borrower address after repayment', fixtures.contracts);
    await fixtures.keeper.stopListeningForLiquidityRequests();
  });
});
