process.env.DEBUG = true;
const Zero = require("@0confirmation/sdk");
const ShifterBorrowProxy = require('../build/ShifterBorrowProxy');
const AssetForwarderLib = require('../build/AssetForwarderLib');
const ERC20Adapter = require('../build/ERC20Adapter');
const ERC20AdapterLib = require('../build/ERC20AdapterLib');
const bre = require("@nomiclabs/buidler");
const ethersToWeb3 = require('ethers-to-web3');
const { ethers } = bre;
const { ZeroMock } = Zero;
const { expect } = require("chai");
const { sync: randomBytes } = require("random-bytes");
const Interface = ethers.utils.Interface;
const ShifterERC20Mock = require("../build/ShifterERC20Mock");
const isNear = (expected, b) => {
  const lowerBound = 0.98 * Number(b);
  expected.to.be.gt(lowerBound);
  const upperBound = 1.02 * Number(b);
  expected.to.be.lt(upperBound);
};

const makeZero = (provider, contracts) => {
  const zero = new ZeroMock(provider);
  zero.setEnvironment(contracts);
  return zero;
};

const stripHexPrefix = (s) => (s.substr(0, 2) === "0x" ? s.substr(2) : s);

const addHexPrefix = (s) => (s.substr(0, 2) === "0x" ? s : "0x" + s);

const removeLeftZeroes = (s) =>
  addHexPrefix(stripHexPrefix(s).replace(/^0+/, ""));

const encodeAddressTriple = (a, b, c) =>
  ethers.utils.defaultAbiCoder.encode(
    ["bytes"],
    [
      ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "address"],
        [a, b, c]
      ),
    ]
  );

const bluebird = require("bluebird");

const fromEthers = require('ethers-to-web3');

const makeProviderForAccountAtIndex = (provider, index) => {
  const engine = new RpcEngine();
  engine.push(providerAsMiddleware(provider));
  engine.push(function (req, res, next, end) {
    if (req.method === "eth_accounts") {
      res.result = [res.result[index]].filter(Boolean);
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
    reject,
  };
};

const nodeUtil = require("util");

const chalk = require("chalk");

const fromDeployment = (deployment, signer) =>
  Object.assign(
    new ethers.Contract(
      deployment.address,
      deployment.abi,
      signer
    ),
    { abi: deployment.abi }
  );

describe("ShifterPool", () => {
  let fixtures;
  before(async () => {
    await bre.deployments.fixture();
    const [ signer, keeperSigner, daoSigner, borrowerSigner ] = await bre.ethers.getSigners();
    const deployments = await Promise.all(
      [
        "ShifterPool",
        "ShifterBorrowProxyFactoryLib",
        "V2SwapAndDrop",
        "DAI",
        "TransferAll",
        "UniswapV2Router01",
        "UniswapV2Factory",
        "ShifterRegistryMock",
      ].map(async (v) => [v, fromDeployment(await bre.deployments.get(v), signer)])
    );
    fixtures = deployments.reduce((r, [contractName, deployment]) => {
      r[contractName] = deployment;
      return r;
    }, {});
    fixtures.provider = ethersToWeb3(signer.provider);
    fixtures.renbtc = {
      address: await fixtures.ShifterRegistryMock.token(),
    };
    const keeperProvider = ethersToWeb3((fixtures.keeperWallet = keeperSigner));
    const borrowerProvider = ethersToWeb3((fixtures.borrowerWallet = borrowerSigner));
    const daoProvider = ethersToWeb3((fixtures.daoWallet = daoSigner));
    const daoAddress = await fixtures.daoWallet.getAddress();
    const network = {
      shifterPool: fixtures.ShifterPool.address,
      mpkh: "0x" + randomBytes(32).toString("hex"),
    };
    fixtures.daoAddress = daoAddress;
    const [borrower, keeper] = [
      makeZero(borrowerProvider, network),
      makeZero(keeperProvider, network),
    ];
    borrower.connectMock(keeper);
    Object.assign(fixtures, {
      borrower,
      keeper,
    });
    fixtures.providerWallet = signer;
    const provider = new ethers.providers.Web3Provider(fixtures.provider);
    const borrowerEthers = new ethers.providers.Web3Provider(borrowerProvider);
    const from = await fixtures.providerWallet.getAddress();
    const keeperAddress = await fixtures.keeperWallet.getAddress();
    const borrowerAddress = await fixtures.borrowerWallet.getAddress();
    Object.assign(fixtures, {
      keeperAddress,
      borrowerAddress,
    });
    await signer.sendTransaction({
      to: keeperAddress,
      value: ethers.utils.parseEther("20")
    });
    await signer.sendTransaction({
      to: borrowerAddress,
      value: ethers.utils.parseEther("20")
    });
    fixtures.from = from;
    const renbtcWrapped = new ethers.Contract(
      fixtures.renbtc.address,
      ShifterERC20Mock.abi,
      fixtures.keeperWallet
    );
    await (
      await renbtcWrapped.mint(
        fixtures.keeperAddress,
        ethers.utils.parseUnits("10", 8)
      )
    ).wait();
    await (await fixtures.keeper.approvePool(fixtures.renbtc.address)).wait();
    fixtures.providerZero = makeZero(ethersToWeb3(signer), network);
    fixtures.daoZero = makeZero(daoProvider, network);
    fixtures.renbtcWrapped = renbtcWrapped;
    await fixtures.providerZero.shifterPool.setKeeper(keeperAddress, true);
    await fixtures.providerZero.shifterPool.transferOwnership(daoAddress);
  });
  it("should add/remove liquidity", async () => {
    const balance = await fixtures.renbtcWrapped.balanceOf(
      fixtures.keeperAddress
    );
    await (
      await fixtures.keeper.approveLiquidityToken(fixtures.renbtc.address)
    ).wait();
    await (
      await fixtures.keeper.addLiquidity(fixtures.renbtc.address, balance)
    ).wait();
    const token = await fixtures.keeper.getLiquidityTokenFor(
      fixtures.renbtc.address
    );
    const balanceBurnToken = await token.balanceOf(fixtures.keeperAddress);
    await (
      await fixtures.keeper.removeLiquidity(
        fixtures.renbtc.address,
        balanceBurnToken
      )
    ).wait();
    isNear(
      expect(
        Number(
          String(await fixtures.renbtcWrapped.balanceOf(fixtures.keeperAddress))
        )
      ),
      Number(String(balance))
    );
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
    const balanceStart = Number(ethers.utils.formatUnits(await fixtures.renbtcWrapped.balanceOf(keeperAddress), await fixtures.renbtcWrapped.decimals()));
    const actions = [
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    ];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('0.1', 8).toString(),
      nonce: '0x' + randomBytes(32).toString('hex'),
      actions,
      gasRequested: ethers.utils.parseEther('0.1').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      await fixtures.keeper.stopListeningForLiquidityRequests();
      const deposited = await v.waitForDeposit(0, 60*1000*30);
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
	//console.log(ethers.utils.formatEther(await fixtures.keeperEthers.getBalance(fixtures.keeperAddress)));
        const receipt = await (await deposited.executeBorrow(ethers.utils.parseUnits('0.1', 8).toString(), '100000', { gasLimit: 6e6, gasPrice: ethers.utils.parseUnits('50', 9), value: ethers.utils.parseEther('0.1') })).wait();
          //console.log(receipt);
	//console.log(ethers.utils.formatEther(await fixtures.keeperEthers.getBalance(fixtures.keeperAddress)));
        deferred.resolve({
          borrowProxy: await deposited.getBorrowProxy(),
          deposited
        });
      } catch (e) {
        deferred.reject(e);
      }
    });
    await liquidityRequestParcel.broadcast();
    const {
      borrowProxy: proxy,
      deposited
    } = await deferred.promise;
    const tx = await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
    expect(Number(ethers.utils.formatUnits(await daiWrapped.balanceOf(fixtures.borrowerAddress), 18))).to.be.gt(1);
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, fixtures.DAI.abi, fixtures.daoZero.getProvider().asEthers());
    const balanceEnd = Number(ethers.utils.formatUnits(await fixtures.renbtcWrapped.balanceOf(keeperAddress), await fixtures.renbtcWrapped.decimals()));
    expect(balanceEnd).to.be.gt(balanceStart);
  });
  it('should default properly', async () => {
    const outputLogs = (v) => v.logs.map((log) => {
      try {
        return new ethers.utils.Interface(fixtures.ShifterPool.abi).parseLog(log).values.message;
      } catch (e) { }
    }).filter(Boolean).forEach((v) => console.log(v));
    const deferred = defer();
    const [ keeperAddress ] = await fixtures.keeper.driver.sendWrapped('eth_accounts', []);
    const [ borrowerAddress ] = await fixtures.borrower.driver.sendWrapped('eth_accounts', []);
    const actions = [
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    ];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('0.1', 8).toString(),
      nonce: '0x' + randomBytes(32).toString('hex'),
      actions,
      gasRequested: ethers.utils.parseEther('0.1').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, fixtures.DAI.abi, fixtures.daoZero.getProvider().asEthers());
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      await fixtures.keeper.stopListeningForLiquidityRequests();
      const deposited = await v.waitForDeposit(30*60*1000);
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
        const receipt = await (await deposited.executeBorrow(ethers.utils.parseUnits('0.1', 8).toString(), '2', { gasLimit: 6e6, value: ethers.utils.parseEther('0.1') })).wait();
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
    await liquidityRequestParcel.broadcast();
    const proxy = await deferred.promise;
    const receipt = await (await proxy.defaultLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
  
  });
  it('should do a fallback shift', async () => {
    const outputLogs = (v) => v.logs.map((log) => {
      try {
        return new ethers.utils.Interface(fixtures.ShifterPool.abi).parseLog(log).values.message;
      } catch (e) { }
    }).filter(Boolean).forEach((v) => console.log(v));
    const deferred = defer();
    const [ keeperAddress ] = await fixtures.keeper.driver.sendWrapped('eth_accounts', []);
    const [ borrowerAddress ] = await fixtures.borrower.driver.sendWrapped('eth_accounts', []);
    const actions = [];
      /*
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    ];
    */
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('0.1', 8).toString(),
      nonce: '0x' + randomBytes(32).toString('hex'),
      actions,
      gasRequested: ethers.utils.parseEther('0').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, fixtures.DAI.abi, fixtures.daoZero.getProvider().asEthers());
    const deposited = await liquidityRequestParcel.waitForDeposit(0, 60*1000*30);
    const receipt = await (await deposited.executeShiftFallback([
      Zero.staticPreprocessor(fixtures.TransferAll.address, ethers.utils.defaultAbiCoder.encode(['bytes'], [ ethers.utils.defaultAbiCoder.encode(['address'], [borrowerAddress]) ]))
    ])).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
  
  });
});
