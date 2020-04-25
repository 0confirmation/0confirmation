'use strict';

const ShifterPool = artifacts.require('ShifterPool');
const ShifterERC20Mock = artifacts.require('ShifterERC20Mock');
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
const Factory = artifacts.require('Factory');
const ethers = require('ethers');
const { ZeroMock } = require('@0confirmation/sdk');
const { mapValues } = require('lodash');
const ProviderEngine = require('web3-provider-engine');

const makeZero = async (provider, contracts) => {
  const zero = new ZeroMock(provider);
  Object.assign(zero.network, mapValues(contracts, (v) => v.address));
  return zero;
};

const makeProviderForAccountAtIndex = (provider, index) => {
  const engine = new ProviderEngine();
  ['send', 'sendAsync'].forEach((v) => {
    engine[v] = async function (o) {
      const [{
        method
      }] = o;
      const result = await provider.send(o);
      if (!result.error && method === 'eth_accounts') {
        result.result = [ result.result[index] ].filter(Boolean)
      }
      return result;
    };
  });
  return engine;
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
    fixtures.provider = fixtures.ShifterPool.contract.currentProvider;
    console.log(Object.keys(fixtures.ShifterPool.contract.currentProvider))
    fixtures.renbtc = {
      address: await fixtures.ShifterRegistry.token()
    };
    fixtures.renbtcExchange = {
      address: await fixtures.Factory.getExchange(fixtures.renbtc.address)
    };
    fixtures.daiExchange = {
      address: await fixtures.Factory.getExchange(fixtures.DAI.address)
    };
    const keeperProvider = makeProviderForAccountAtIndex(fixtures.provider, 2);
    const [ borrower, keeper ] = await Promise.all([
      makeZero(makeProviderForAccountAtIndex(fixtures.provider, 1)),
      makeZero(keeperProvider)
    ]);
    borrower.connectMock(keeper);
    Object.assign(fixtures, {
      borrower,
      keeper
    });
    const provider = new ethers.providers.Web3Provider(fixtures.provider);
    const [ from ] = await provider.send('eth_accounts', []);
    fixtures.from = from;
    await Promise.all([ [ fixtures.renbtc.address, fixtures.renbtcExchange.address ], [ fixtures.DAI.address, fixtures.daiExchange.address ] ].map(async ([ token, exchange ]) => {
      const tokenWrapped = new ethers.Contract(token, DAI.abi, provider.getSigner());
      await (await tokenWrapped.mint(from, ethers.constants.MaxUint256)).wait();
      const exchangeWrapped = new ethers.Contract(exchange, Exchange.abi, provider.getSigner());
      await (await tokenWrapped.approve(exchangeWrapped.address, ethers.constants.MaxUint256)).wait();
      await (await exchangeWrapped.addLiquidity(ethers.utils.parseEther('10'), ethers.utils.parseUnits('100', 8), String(Date.now() * 2), {
        value: ethers.utils.hexlify(ethers.utils.parseEther('10')),
        gasLimit: ethers.utils.hexlify(6e6)
      })).wait();
    }));
    const [ keeperAddress ] = await provider.send('eth_accounts', []);
    fixtures.keeperAddress = keeperAddress;
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, ShifterERC20Mock.abi, new ethers.providers.Web3Provider(keeperProvider).getSigner());
    await (await renbtcWrapped.mint(fixtures.keeperAddress, ethers.utils.parseUnits('10', 8))).wait();
    await (await fixtures.keeper.approveLiquidityToken(fixtures.renbtc.address)).wait();
    await (await fixtures.keeper.addLiquidity(fixtures.renbtc.address, ethers.utils.parseUnits('5', 8).toString())).wait();
    await (await fixtures.keeper.approvePool(fixtures.renbtc.address)).wait();
  });
  it('should execute a payment', async () => {
    const deferred = defer();
    const exchange = fixtures.contracts.exchange;
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
      to: fixtures.contracts.exchange,
      calldata: (new ethers.utils.Interface(filterABI(Exchange.abi))).functions.tokenToTokenSwapInput.encode([ ethers.utils.parseUnits('1.97', 8), '1', '1', String(Date.now() * 2), fixtures.contracts.dai ])
    }, Zero.preprocessor(TransferAll, fixtures.contracts.dai, borrowerAddress)];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.contracts.zbtc,
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
    const exchangeWrapped = new ethers.Contract(fixtures.contracts.exchange, filterABI(Exchange.abi), borrowedProvider.getSigner());
    await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    await fixtures.keeper.stopListeningForLiquidityRequests();
  });
});
