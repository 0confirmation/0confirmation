process.env.DEBUG = true;
const Zero = require("@0confirmation/sdk");
const ShifterBorrowProxy = require('../build/ShifterBorrowProxy');
const AssetForwarderLib = require('../build/AssetForwarderLib');
const ERC20Adapter = require('../build/ERC20Adapter');
const ERC20AdapterLib = require('../build/ERC20AdapterLib');
const bre = require("@nomiclabs/buidler");
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

const makePrivateKeyWalletWithPersonalSign = require("@0confirmation/providers/private-key-or-seed");
const fromEthers = require("@0confirmation/providers/from-ethers");

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
    const [ signer ] = await bre.ethers.getSigners();
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
    fixtures.provider = fromEthers(signer.provider);
    fixtures.renbtc = {
      address: await fixtures.ShifterRegistryMock.token(),
    };
    const keeperProvider = makePrivateKeyWalletWithPersonalSign(
      randomBytes(32).toString("hex"),
      fixtures.provider
    );
    const borrowerProvider = makePrivateKeyWalletWithPersonalSign(
      randomBytes(32).toString("hex"),
      fixtures.provider
    );
    const daoProvider = makePrivateKeyWalletWithPersonalSign(
      randomBytes(32).toString("hex"),
      fixtures.provider
    );
    const daoAddress = (
      await new ethers.providers.Web3Provider(daoProvider).listAccounts()
    )[0];
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
    const provider = new ethers.providers.Web3Provider(fixtures.provider);
    const keeperEthers = new ethers.providers.Web3Provider(keeperProvider);
    const borrowerEthers = new ethers.providers.Web3Provider(borrowerProvider);
    const [from] = await provider.send("eth_accounts", []);
    const [keeperAddress] = await keeperEthers.send("eth_accounts", []);
    const [borrowerAddress] = await borrowerEthers.send("eth_accounts", []);
    Object.assign(fixtures, {
      keeperAddress,
      borrowerAddress,
    });
    await provider.waitForTransaction(
      await provider.send("eth_sendTransaction", [
        {
          from,
          to: keeperAddress,
          value: removeLeftZeroes(
            ethers.utils.hexlify(ethers.utils.parseEther("20"))
          ),
        },
      ])
    );
    await provider.waitForTransaction(
      await provider.send("eth_sendTransaction", [
        {
          from,
          to: borrowerAddress,
          value: removeLeftZeroes(
            ethers.utils.hexlify(ethers.utils.parseEther("20"))
          ),
        },
      ])
    );
    fixtures.from = from;
    const renbtcWrapped = new ethers.Contract(
      fixtures.renbtc.address,
      ShifterERC20Mock.abi,
      new ethers.providers.Web3Provider(keeperProvider).getSigner()
    );
    await (
      await renbtcWrapped.mint(
        fixtures.keeperAddress,
        ethers.utils.parseUnits("10", 8)
      )
    ).wait();
    await (await fixtures.keeper.approvePool(fixtures.renbtc.address)).wait();
    fixtures.providerZero = makeZero(fixtures.provider, network);
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
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit(0, 60*1000*30);
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
	fixtures.keeperEthers = new ethers.providers.Web3Provider(fixtures.keeper.getProvider());
	//console.log(ethers.utils.formatEther(await fixtures.keeperEthers.getBalance(fixtures.keeperAddress)));
        const receipt = await (await deposited.executeBorrow(ethers.utils.parseUnits('0.1', 8).toString(), '100000', { gasPrice: ethers.utils.parseUnits('50', 9) })).wait();
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
    const actions = [
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    ];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('0.1', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cf',
      actions,
      gasRequested: ethers.utils.parseEther('0').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    await liquidityRequestParcel.broadcast();
    const {
      borrowProxy: proxy,
      deposited
    } = await deferred.promise;
    await (await proxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
    expect(Number(ethers.utils.formatUnits(await daiWrapped.balanceOf(fixtures.borrowerAddress), 18))).to.be.gt(1);
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, fixtures.DAI.abi, fixtures.daoZero.getProvider().asEthers());
    const balanceEnd = Number(ethers.utils.formatUnits(await fixtures.renbtcWrapped.balanceOf(keeperAddress), await fixtures.renbtcWrapped.decimals()));
    expect(balanceEnd).to.be.gt(balanceStart);
    await fixtures.keeper.stopListeningForLiquidityRequests();
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
    await fixtures.keeper.listenForLiquidityRequests(async (v) => {
      const deposited = await v.waitForDeposit(30*60*1000);
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
        const receipt = await (await deposited.executeBorrow(ethers.utils.parseUnits('0.1', 8).toString(), '2')).wait();
        deferred.resolve(await deposited.getBorrowProxy());
      } catch (e) {
        deferred.reject(e);
      }
    });
    const actions = [
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    ];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('0.1', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cd',
      actions,
      gasRequested: ethers.utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, fixtures.DAI.abi, fixtures.daoZero.getProvider().asEthers());
    await liquidityRequestParcel.broadcast();
    const proxy = await deferred.promise;
    const receipt = await (await proxy.defaultLoan({ gasLimit: ethers.utils.hexlify(6e6) })).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
  
    await fixtures.keeper.stopListeningForLiquidityRequests();
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
    const actions = [
      Zero.staticPreprocessor(fixtures.V2SwapAndDrop.address, encodeAddressTriple(fixtures.UniswapV2Router01.address, fixtures.DAI.address, borrowerAddress)),
      
    ];
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.renbtc.address,
      amount: ethers.utils.parseUnits('0.1', 8).toString(),
      nonce: '0x88b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cf',
      actions,
      gasRequested: ethers.utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
    const renbtcWrapped = new ethers.Contract(fixtures.renbtc.address, fixtures.DAI.abi, fixtures.daoZero.getProvider().asEthers());
    const deposited = await liquidityRequestParcel.waitForDeposit(0, 60*1000*30);
    const receipt = await (await deposited.executeShiftFallback([
      Zero.staticPreprocessor(fixtures.TransferAll.address, ethers.utils.defaultAbiCoder.encode(['bytes'], [ ethers.utils.defaultAbiCoder.encode(['address'], [borrowerAddress]) ]))
    ])).wait();
    const iface = new Interface(ShifterBorrowProxy.abi.concat(AssetForwarderLib.abi).concat(ERC20Adapter.abi).concat(ERC20AdapterLib.abi));
    const daiWrapped = new ethers.Contract(fixtures.DAI.address, fixtures.DAI.abi, fixtures.borrower.getProvider().asEthers());
  
    await fixtures.keeper.stopListeningForLiquidityRequests();
  });
});
