'use strict';

const UniswapV2Router01 = artifacts.require('UniswapV2Router01');
const AssetForwarderLib = artifacts.require('AssetForwarderLib');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const ShifterPool = artifacts.require('ShifterPool');
const ShifterERC20Mock = artifacts.require('ShifterERC20Mock');
const randomBytes = require('random-bytes').sync;
const SandboxLib = artifacts.require('SandboxLib');
const BorrowProxy = artifacts.require('BorrowProxy');
const SimpleBurnLiquidationModule = artifacts.require('SimpleBurnLiquidationModule');
const expect = require('chai').expect;
const ERC20Adapter = artifacts.require('ERC20Adapter');
const ERC20AdapterLib = artifacts.require('ERC20AdapterLib');
const LiquidityToken = artifacts.require('LiquidityToken');
const CurveAdapter = artifacts.require('CurveAdapter');
const ShifterRegistryMock = artifacts.require('ShifterRegistryMock');
const ShifterBorrowProxyFactoryLib = artifacts.require('ShifterBorrowProxyFactoryLib');
const ShifterBorrowProxy = artifacts.require('ShifterBorrowProxy');
const Curvefi = artifacts.require('Curvefi');
const CurveToken = artifacts.require('CurveToken');
const DAI = artifacts.require('DAI');
const WBTC = artifacts.require('WBTC');
const V2SwapAndDrop = artifacts.require('V2SwapAndDrop');
const ethers = require('ethers');
const Zero = require('@0confirmation/sdk');
const { ZeroMock } = Zero;
const { mapValues } = require('lodash');
const RpcEngine = require('json-rpc-engine');
const providerFromMiddleware = require('eth-json-rpc-middleware/providerFromMiddleware');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const asMiddleware = require('json-rpc-engine/src/asMiddleware');

const Interface = ethers.utils.Interface;

const makeZero = async (provider, contracts) => {
  const zero = new ZeroMock(provider);
  zero.setEnvironment(contracts);
  return zero;
};

const getAddress = async (artifact) => (await artifact.deployed()).address;

const encodeAddressTriple = (a, b, c) => ethers.utils.defaultAbiCoder.encode(['bytes'], [ ethers.utils.defaultAbiCoder.encode(['address', 'address', 'address' ], [ a, b, c ]) ]);

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

const chalk = require('chalk');

contract('ShifterPool', () => {
  let fixtures;
  before(async () => {
    fixtures = {
      ShifterPool: await ShifterPool.deployed(),
      ShifterBorrowProxyFactoryLib: await ShifterBorrowProxyFactoryLib.deployed(),
      Curvefi: await Curvefi.deployed(),
      V2SwapAndDrop: await V2SwapAndDrop.deployed(),
      CurveToken: await CurveToken.deployed(),
      DAI: await DAI.deployed(),
      WBTC: await WBTC.deployed(),
      UniswapV2Router01: await UniswapV2Router01.deployed(),
      UniswapV2Factory: await UniswapV2Factory.deployed(),
      ShifterRegistry: await ShifterRegistryMock.deployed()
    };
    fixtures.provider = fromTruffleProvider(fixtures.ShifterPool.contract.currentProvider);
    fixtures.renbtc = {
      address: await fixtures.ShifterRegistry.token()
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
    Object.assign(fixtures, {
      keeperAddress,
      borrowerAddress
    });
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
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, ShifterERC20Mock.abi, new ethers.providers.Web3Provider(keeperProvider).getSigner());
    
    await (await renbtcWrapped.mint(fixtures.keeperAddress, ethers.utils.parseUnits('10', 8))).wait();
    await (await fixtures.keeper.approvePool(fixtures.renbtc.address)).wait();
  });
  it('should execute a payment', async () => {
    const outputLogs = (v) => v.logs.map((log) => {
      try {
        return new ethers.utils.Interface(fixtures.ShifterPool.abi).parseLog(log).values.message;
      } catch (e) { }
    }).filter(Boolean).forEach((v) => console.log(v));
    const deferred = defer();
    const [ keeperAddress ] = await fixtures.keeper.driver.sendWrapped('eth_accounts', []);
    const [ borrowerAddress ] = await fixtures.borrower.driver.sendWrapped('eth_accounts', []);
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit();
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
        const receipt = await (await deposited.executeBorrow(ethers.utils.parseUnits('1', 8).toString(), '100000')).wait();
        console.log(Number(receipt.gasUsed));
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
    const actions = [
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    //  Zero.staticPreprocessor(fixtures.TransferAll.address, encodeAddressPair(fixtures.DAI.address, borrowerAddress))
    ];
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
    console.log(await proxy.queryTransfers());
    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    const receipt = await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
    expect(Number(ethers.utils.formatUnits(await daiWrapped.balanceOf(borrowerAddress), 18)) > 15000).to.be.true;
    console.log(await proxy.queryTransfers());
    await fixtures.keeper.stopListeningForLiquidityRequests();
  });
});
