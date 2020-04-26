'use strict';

const ShifterPool = artifacts.require('ShifterPool');
const ShifterERC20Mock = artifacts.require('ShifterERC20Mock');
const randomBytes = require('random-bytes').sync;
const SandboxLib = artifacts.require('SandboxLib');
const UniswapAdapter = artifacts.require('UniswapAdapter');
const SimpleBurnLiquidationModule = artifacts.require('SimpleBurnLiquidationModule');
const ERC20Adapter = artifacts.require('ERC20Adapter');
const LiquidityToken = artifacts.require('LiquidityToken');
const CurveAdapter = artifacts.require('CurveAdapter');
const ShifterRegistryMock = artifacts.require('ShifterRegistryMock');
const ShifterBorrowProxyFactoryLib = artifacts.require('ShifterBorrowProxyFactoryLib');
const Curvefi = artifacts.require('Curvefi');
const CurveToken = artifacts.require('CurveToken');
const DAI = artifacts.require('DAI');
const WBTC = artifacts.require('WBTC');
const Exchange = artifacts.require('Exchange');
const TransferAll = artifacts.require('TransferAll');
const Factory = artifacts.require('Factory');
const ethers = require('ethers');
const Zero = require('@0confirmation/sdk');
const { ZeroMock } = Zero;
const { mapValues } = require('lodash');
const RpcEngine = require('json-rpc-engine');
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const asMiddleware = require('json-rpc-engine/src/asMiddleware')


const makeZero = async (provider, contracts) => {
  const zero = new ZeroMock(provider);
  Object.assign(zero.network, contracts);
  return zero;
};

const bluebird = require('bluebird');

const makePrivateKeyWalletWithPersonalSign = (pvt, provider) => {
  const engine = new RpcEngine();
  const wallet = new ethers.Wallet('0x' + pvt);
  const walletProvider = new HDWalletProvider(pvt, provider);
  engine.push(providerAsMiddleware(walletProvider));
  engine.push(function (req, res, next, end) {
    if (req.method === 'personal_sign') {
      res.result = wallet.signMessage(ethers.utils.arrayify(req.params[0]));
    }
    end();
  });
  return providerFromEngine(engine);
};

const fromTruffleProvider = (provider) => {
  const engine = new RpcEngine();
  engine.push(function (req, res, next, end) {
    provider.send(req, (err, result) => {
      Object.assign(res, result);
      end();
    });
  });
  return providerFromEngine(engine);
};

const makeProviderForAccountAtIndex = (provider, index) => {
  const engine = new RpcEngine();
  engine.push(providerAsMiddleware(provider));
  engine.push(function (req, res, next, end) {
    if (req.method === 'eth_accounts') {
      res.result = [ res.result[index] ].filter(Boolean);
    }
    end();
  });
  return providerFromEngine(engine);
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

contract('ShifterPool', () => {
  let fixtures;
  before(async () => {
    fixtures = {
      ShifterPool: await ShifterPool.deployed(),
      ShifterBorrowProxyFactoryLib: await ShifterBorrowProxyFactoryLib.deployed(),
      Curvefi: await Curvefi.deployed(),
      CurveToken: await CurveToken.deployed(),
      DAI: await DAI.deployed(),
      WBTC: await WBTC.deployed(),
      Exchange: await Exchange.deployed(),
      Factory: await Factory.deployed(),
      ShifterRegistry: await ShifterRegistryMock.deployed()
    };
    fixtures.provider = fromTruffleProvider(fixtures.ShifterPool.contract.currentProvider);
    fixtures.renbtc = {
      address: await fixtures.ShifterRegistry.token()
    };
    fixtures.renbtcExchange = {
      address: await fixtures.Factory.getExchange(fixtures.renbtc.address)
    };
    fixtures.daiExchange = {
      address: await fixtures.Factory.getExchange(fixtures.DAI.address)
    };
    const keeperProvider = makePrivateKeyWalletWithPersonalSign(randomBytes(32).toString('hex'), fixtures.provider);
    const borrowerProvider = makePrivateKeyWalletWithPersonalSign(randomBytes(32).toString('hex'), fixtures.provider);
    const network = {
      shifterPool: fixtures.ShifterPool.address,
      mpkh: '0x' + randomBytes(32).toString('hex')
    };
    const [ borrower, keeper ] = await Promise.all([
      makeZero(borrowerProvider, network),
      makeZero(keeperProvider, network)
    ]);
    borrower.connectMock(keeper);
    Object.assign(fixtures, {
      borrower,
      keeper
    });
    const provider = new ethers.providers.Web3Provider(fixtures.provider);
    const keeperEthers = new ethers.providers.Web3Provider(keeperProvider);
    const borrowerEthers = new ethers.providers.Web3Provider(borrowerProvider);
    const [ from ] = await provider.send('eth_accounts', []);
    const [ keeperAddress ] = await keeperEthers.send('eth_accounts', []);
    const [ borrowerAddress ] = await borrowerEthers.send('eth_accounts', []);
    await provider.waitForTransaction(await provider.send('eth_sendTransaction', [{
      from,
      to: keeperAddress,
      value: ethers.utils.hexlify(ethers.utils.parseEther('20'))
    }]));
    await provider.waitForTransaction(await provider.send('eth_sendTransaction', [{
      from,
      to: borrowerAddress,
      value: ethers.utils.hexlify(ethers.utils.parseEther('20'))
    }]));
    fixtures.from = from;
    const amount = ethers.utils.bigNumberify('0xffffffffffffffffffffffffffffffffffffffff');
    console.log('minting tokens');
    await Promise.all([ [ fixtures.renbtc.address, fixtures.renbtcExchange.address ], [ fixtures.DAI.address, fixtures.daiExchange.address ] ].map(async ([ token, exchange ]) => {
      const tokenWrapped = new ethers.Contract(token, DAI.abi, provider.getSigner());
      await (await tokenWrapped.mint(from, amount)).wait();
      const exchangeWrapped = new ethers.Contract(exchange, Exchange.abi, provider.getSigner());
      await (await tokenWrapped.approve(exchangeWrapped.address, amount)).wait();
      await (await exchangeWrapped.addLiquidity(ethers.utils.parseEther('10'), ethers.utils.parseUnits('100', 8), String(Date.now() * 2), {
        value: ethers.utils.hexlify(ethers.utils.parseEther('10')),
        gasLimit: ethers.utils.hexlify(6e6)
      })).wait();
    }));
    console.log('minted tokens');
    console.log(keeperAddress);
    fixtures.keeperAddress = keeperAddress;
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, ShifterERC20Mock.abi, new ethers.providers.Web3Provider(keeperProvider).getSigner());
    console.log(renbtcWrapped);
    console.log(await renbtcWrapped.balanceOf(fixtures.keeperAddress));
    
    await (await renbtcWrapped.mint(fixtures.keeperAddress, ethers.utils.parseUnits('10', 8))).wait();
    console.log('minted more');
    console.log('minted');
    await (await fixtures.keeper.approveLiquidityToken(fixtures.renbtc.address)).wait();
      console.log('approved');
    await (await fixtures.keeper.addLiquidity(fixtures.renbtc.address, ethers.utils.parseUnits('5', 8).toString())).wait();
      console.log('woop');
    await (await fixtures.keeper.approvePool(fixtures.renbtc.address)).wait();
    console.log('added');
  });
  it('should execute a payment', async () => {
    const deferred = defer();
    const [ keeperAddress ] = await fixtures.keeper.driver.sendWrapped('eth_accounts', []);
    const [ borrowerAddress ] = await fixtures.borrower.driver.sendWrapped('eth_accounts', []);
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit();
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
        const receipt = await (await deposited.executeBorrow(ethers.utils.parseUnits('1', 8).toString(), '100000')).wait();
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
    const TRANSFER_TARGET = '0x' + Array(40).fill('1').join('');
    const actions = [{
      to: fixtures.renbtcExchange.address,
      calldata: (new ethers.utils.Interface((Exchange.abi))).functions.tokenToTokenSwapInput.encode([ ethers.utils.parseUnits('1.97', 8), '1', '1', String(Date.now() * 2), fixtures.DAI.address ])
    }, Zero.preprocessor(TransferAll, fixtures.DAI.address, borrowerAddress)];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cf',
      actions,
      gasRequested: ethers.utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    await liquidityRequestParcel.broadcast();
    const proxy = await deferred.promise;
    await fixtures.borrower.setBorrowProxy(liquidityRequestParcel.proxyAddress);
    const borrowedProvider = new Web3Provider(fixtures.borrower.getProvider());
    const exchangeWrapped = new ethers.Contract(fixtures.renbtcExchange.address, (Exchange.abi), borrowedProvider.getSigner());
    await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    await fixtures.keeper.stopListeningForLiquidityRequests();
  });
});
