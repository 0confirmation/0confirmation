const Zero = require('../lib/sdk');
const bip39 = require('bip39');
const ethers = require('ethers');
const { utils } = ethers;
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const seed = bip39.mnemonicToSeed(mnemonic);
const hdkey = require('ethereumjs-wallet/hdkey');
const hdwallet = hdkey.fromMasterSeed(seed);
const { promisify } = require('bluebird');
const privateKeys = Array(10).fill(null).map((_, i) => hdwallet.derivePath("m/44'/60'/0'/0/" + String(i)).getWallet().getPrivateKeyString());

const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache-cli');
const key = privateKeys[0].substr(2);
const ganacheInstance = process.env.EXTERNAL_GANACHE ? 'http://localhost:8545' : ganache.provider({
  mnemonic,
  gasLimit: '100000000'
});
const provider = new HDWalletProvider(key, ganacheInstance);



const ethersProvider = new Web3Provider(provider);


const startSignalingServer = require('@0confirmation/webrtc-star');
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

async function generatebtcaddress (){
	  const fixtures = {};
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
 
    const liquidityRequest = fixtures.borrower.createLiquidityRequest({
      token: fixtures.contracts.zbtc,
      amount: utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16ce',
      actions: [],
      gasRequested: utils.parseEther('0.01').toString()
    });
    const liquidityRequestParcel = await liquidityRequest.sign();
}

generatebtcaddress();