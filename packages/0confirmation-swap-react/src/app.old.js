import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Row, Col, Modal, ModalBody, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { async } from 'q';
process.binding = () => ({
  fs: {},
  os: {
    errno: {}
  }
});
const RpcEngine = require('json-rpc-engine');
const providerFromEngine = require('eth-json-rpc-middleware/providerFromEngine');
const providerAsMiddleware = require('eth-json-rpc-middleware/providerAsMiddleware');
const memdown = require('memdown');
const encode = require('encoding-down');
const randomBytes = require('random-bytes').sync;
const personalSignProviderFromPrivate = require('@0confirmation/predictions/private-key-or-seed');
const web3ProviderFromEthers = require('@0confirmation/predictions/from-ethers');
const url = require('url');
const ShifterERC20Mock = require('@0confirmation/sol/build/ShifterERC20Mock');
const TransferAll = require('@0confirmation/sol/build/TransferAll');
const SwapEntireLoan = require('@0confirmation/sol/build/SwapEntireLoan');
const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const BTCBackend = require('@0confirmation/sdk/backends/btc');
const DAI = require('@0confirmation/sol/build/DAI');
const uniswap = require('@uniswap/sdk');
const uniswapConstants = require('@uniswap/sdk/dist/constants');
const makeArtifacts = require('@0confirmation/sol/artifacts');
const coreMigration = require('@0confirmation/sol/migrations/1_initial_migration');
const util = require('./util');
const Provider = require('ganache-core/lib/provider');


const getSwapAmountFromBorrowReceipt = (receipt, address) => {
  const iface = new ethers.utils.Interface(DAI.abi);
  const parsedLogs = receipt.logs.map((v) => {
    try {
      let parsed = iface.parseLog(v);
      return parsed;
    } catch (e) {}
  }).filter(Boolean).filter((v) => {
    return v.values.from === address;
  }).map((v) => {
    return v.values.value.toString(10);
  });
  return parsedLogs[parsedLogs.length - 1];
};
  

const ln = (v) => ((console.log(v)), v);

const Zero = require('@0confirmation/sdk');
const { ZeroMock } = Zero;
const ethers = require('ethers');
const __IS_TEST = Boolean(process.env.REACT_APP_TEST);

const createSwapActions = ({
  dai,
  factory,
  borrower
}) => [
  Zero.preprocessor(SwapEntireLoan, factory, dai),
    
  Zero.preprocessor(TransferAll, dai, borrower)
];

const makeMetamaskSimulatorForRemoteGanache = (suppliedMetamask) => {
  const metamask = suppliedMetamask || window.ethereum;
  const ethersMetamask = new ethers.providers.Web3Provider(metamask);
  const from = metamask.selectedAddress || '0x' + randomBytes(20).toString('hex');
  const pvt = ethers.utils.solidityKeccak256(['address'], [ from ]);
  const baseProvider = personalSignProviderFromPrivate(pvt.substr(2), provider)
  const wallet = new ethers.Wallet(pvt, new ethers.providers.Web3Provider(baseProvider));
  const engine = new RpcEngine();
  engine.push((req, res, next, end) => {
    const { selectedAddress } = metamask;
    if (selectedAddress && req.method === 'personal_sign') {
      ethersMetamask.send(req.method, [ req.params[1], selectedAddress ]).then((result) => next()).catch((err) => {
        next()
      }); 
    } else { next(); }
  });
  engine.push(providerAsMiddleware(baseProvider));
  return Object.assign(providerFromEngine(engine), {
    selectedAddress: wallet.address
  });
};

const provider = __IS_TEST ? new Provider({
  db: encode(memdown(), { valueEncoding: 'json' }),
  db_path: '/'
}) : window.ethereum;

if (window.ethereum) {
  window.ethereum.enable();
  if (__IS_TEST) window.ethereum = makeMetamaskSimulatorForRemoteGanache(window.ethereum);
} else {
  window.ethereum = provider;
}


const getDAIBTCMarket = async (provider) => {
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const daiReserves = await uniswap.getTokenReserves(contracts.dai, ethersProvider);
  const btcReserves = await uniswap.getTokenReserves(await getRenBTCAddress(provider), ethersProvider);
  return await uniswap.getMarketDetails(btcReserves, daiReserves);
};

const getTradeExecution = async (provider, details, amount) => {
  const market = await getDAIBTCMarket(provider);
  return await uniswap.getTradeDetails(uniswap.TRADE_EXACT.INPUT, amount, details || await getDAIBTCMarket(provider));
};

const getBorrows = async (zero) => {
  const borrowProxies = await zero.getBorrowProxies();
  for (const borrowProxy of borrowProxies) {
    borrowProxy.pendingTransfers = await borrowProxy.queryPendingTransfers();
  }
  return borrowProxies;
};


const globalEthersProvider = new ethers.providers.Web3Provider(provider);

const makeZero = (provider, contracts) => {
  const zero = __IS_TEST ? new ZeroMock(provider) : new Zero(provider);
  if (__IS_TEST && process.env.REACT_APP_USE_BTC_TESTNET) zero.registerBackend(new BTCBackend({
    network: 'testnet'
  }));
  zero.setEnvironment(contracts);
  return zero;
};

const { getAddresses } = require('@0confirmation/sdk/environments');
const contracts = __IS_TEST ? getAddresses('ganache') : getAddresses(process.env.REACT_APP_NETWORK);
const zero = makeZero(window.ethereum, contracts);

const getMockRenBTCAddress = async (provider, contracts) => {
  const registry = new ethers.Contract(contracts.shifterRegistry, ShifterRegistryMock.abi, provider);
  return await registry.token();
};

const getRenBTCAddress = async () => {
  return contracts.renbtc || __IS_TEST && (contracts.renbtc = await getMockRenBTCAddress(new ethers.providers.Web3Provider(provider), contracts));
};

const setupTestUniswapSDK = async (provider) => {
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const chainId = await ethersProvider.send('net_version', []);
  console.log(chainId);
  uniswapConstants.FACTORY_ADDRESS[Number(chainId)] = contracts.factory;
  uniswapConstants.SUPPORTED_CHAIN_ID[Number(chainId)] = 'Lendnet';
  uniswapConstants.SUPPORTED_CHAIN_ID.Lendnet = Number(chainId);
  uniswapConstants._CHAIN_ID_NAME[Number(chainId)] = 'lendnet';
};

let getDepositedParcel = async (parcel) => await parcel.waitForDeposit();
let waitForRepayment = async (deposited) => await deposited.waitForSignature(); // this one needs to be fixed for mainnet
let getBorrowProxyCreationReceipt = async (parcel) => {
  while (true) {
    const proxy = await parcel.getBorrowProxy();
    if (proxy) return proxy;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } // fix this so it returns a receipt
};

const defer = () => {
  let resolve, reject;
  let promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
};

let setup = Promise.resolve();

if (__IS_TEST) {
  setup = (async () => {
    const artifacts = makeArtifacts(provider);
    console.log('running');
    await artifacts.runMigration(coreMigration);
    console.log('migration run');
    Object.assign(contracts, {
      dai: artifacts.require('DAI').address,
      factory: artifacts.require('Factory').address,
      shifterRegistry: artifacts.require('ShifterRegistryMock').address,
      renbtc: await getMockRenBTCAddress(new ethers.providers.Web3Provider(provider), {
        shifterRegistry: artifacts.require('ShifterRegistryMock').address
      }),
      shifterPool: artifacts.require('ShifterPool').address
    });
    console.log(contracts);
    console.log('environment:');
    console.log(contracts);
    zero.setEnvironment(contracts);
    let promiseMap = {
      deposited: {},
      repayment: {},
      borrow: {}
    };
    getDepositedParcel = async (parcel) => {
      let deferred = promiseMap.deposited[parcel.proxyAddress] = promiseMap.deposited[parcel.proxyAddress] || defer();
      promiseMap.repayment[parcel.proxyAddress] = promiseMap.repayment[parcel.proxyAddress] || defer();
      promiseMap.borrow[parcel.proxyAddress] = promiseMap.borrow[parcel.proxyAddress] || defer();
      return await deferred.promise;
    };
    waitForRepayment = async (deposited) => {
      let deferred = promiseMap.repayment[deposited.proxyAddress] = promiseMap.repayment[deposited.proxyAddress] || defer();
      await deferred.promise;
    };
    getBorrowProxyCreationReceipt = async (parcel) => {
      let deferred = promiseMap.borrow[parcel.proxyAddress] = promiseMap.borrow[parcel.proxyAddress] || defer();
      return await deferred.promise;
    };
    const ganacheEthers = new ethers.providers.Web3Provider(provider);
    const ganacheWeb3Compatible = provider;
    await setupTestUniswapSDK(ganacheWeb3Compatible);
    console.log('setup uniswap done');
    console.log(await getDAIBTCMarket(ganacheWeb3Compatible));
    console.log('setup uniswap done');
    const ganacheAddress = (await ganacheEthers.send('eth_accounts', []))[0];
    const keeperPvt = ethers.utils.solidityKeccak256(['address'], [ ganacheAddress ]).substr(2);
    const keeperProvider = personalSignProviderFromPrivate(keeperPvt, ganacheWeb3Compatible);
    const keeperEthers = new ethers.providers.Web3Provider(keeperProvider);
    const [ keeperAddress ] = await keeperEthers.send('eth_accounts', []);
    console.log('initializing mock keeper at: ' + keeperAddress);
    if ((Number(await ganacheEthers.send('eth_getBalance', [ keeperAddress, 'latest' ]))) < Number(ethers.utils.parseEther('9'))) {
      console.log('this keeper needs ether! sending 10');
      const sendEtherTx = await ganacheEthers.send('eth_sendTransaction', [{
        value: ethers.utils.hexlify(ethers.utils.parseEther('10')),
        gas: ethers.utils.hexlify(21000),
        gasPrice: '0x01',
        to: keeperAddress,
        from: ganacheAddress
      }]);
      await ganacheEthers.waitForTransaction(sendEtherTx);
      console.log('done!');
    }
    const renbtcWrapped = new ethers.Contract(await getRenBTCAddress(), ShifterERC20Mock.abi, keeperEthers.getSigner());
    console.log('minting 10 renbtc for keeper --');
    await (await renbtcWrapped.mint(keeperAddress, ethers.utils.parseUnits('10', 8))).wait();
    console.log('done!');
    const keeperZero = makeZero(keeperProvider, contracts);
    keeperZero.connectMock(zero);
    console.log('shifter pool: ' + contracts.shifterPool);
    console.log('renbtc: ', contracts.renbtc);
    await (await keeperZero.approvePool(contracts.renbtc)).wait();
    console.logBold = console.log;
    console.logKeeper = (v) => console.logBold('keeper: ' + String(v));
    console.logKeeper('online -- listening for loan requests!');
    keeperZero.listenForLiquidityRequests(async (v) => {
      console.logBold('waiting ..');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.logBold('received liquidity request over libp2p!');
      console.logKeeper('got liquidity request!');
      console.logKeeper('computing BTC address from liquidity request parameters: ' + v.depositAddress);
      console.logKeeper('OK! ' + v.proxyAddress + ' is a borrow proxy derived from a deposit of ' + ethers.utils.formatUnits(v.amount, 8) + ' BTC at the target address');
      if (Number(ethers.utils.formatEther(v.gasRequested)) > 0.1) {
        console.logKeeper('request is for too much gas -- abort');
        return
      }
      const deposited = await v.waitForDeposit();
      let depositedDeferred = promiseMap.deposited[deposited.proxyAddress] || (promiseMap.deposited[deposited.proxyAddress] = defer());
      if (depositedDeferred) depositedDeferred.resolve(deposited);
      console.logKeeper('found deposit -- initializing a borrow proxy!')
      const bond = ethers.utils.bigNumberify(v.amount).div(9);
      const receipt = await (await deposited.executeBorrow(bond, '100000')).wait();
      let borrowDeferred = promiseMap.borrow[deposited.proxyAddress] || (promiseMap.borrow[deposited.proxyAddress] = defer());
      if (borrowDeferred) borrowDeferred.resolve(receipt);
      const result = await deposited.submitToRenVM();
      const sig = await deposited.waitForSignature();
      try {
        const borrowProxy = await deposited.getBorrowProxy();
        console.logKeeper('waiting for renvm ...');
        await new Promise((resolve, reject) => setTimeout(resolve, 60000));
        console.logKeeper('repaying loan for ' + deposited.proxyAddress + ' !');
        await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) });
        let repaymentDeferred = promiseMap.repayment[deposited.proxyAddress] || (promiseMap.repayment[deposited.proxyAddress] = defer());
        if (repaymentDeferred) repaymentDeferred.resolve();
      } catch (e) {
        console.logKeeper('error');
        console.error(e);
      }
    });
  })().catch((err) => console.error(err));
}

const DECIMALS = {
  btc: 8,
  dai: 18
};

const coerceToDecimals = (nameOrDecimals) => typeof nameOrDecimals === 'string' && isNaN(nameOrDecimals) ? DECIMALS[nameOrDecimals] : Number(nameOrDecimals);

const toFormat = (v, decimals) => util.truncateDecimals(ethers.utils.formatUnits(v, coerceToDecimals(decimals)), 4);

const toParsed = (v, decimals) => ethers.utils.parseUnits(v, coerceToDecimals(decimals));


export default class App extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      value:0,
      rate: 'N/A',
      coin: "DAI",
      calcValue: 0,
      percentage: '...',
      sliplimit: '...',
      modal: false,
      address: "X93jdjd90dkakdjdlalhhdohodhohofhohohdlslhjhlfhjslhjhkhk",
      menu: false,
      selectedAddress: '0x' + Array(40).fill('0').join(''),
      parcel: null,
      borrowProxy: null,
      proxies: []
    }
  }
  async initializeMarket() {
    await this.updateMarket();
    this.setState({
      rate: util.truncateDecimals(this.state.market.marketRate.rate.toString(10), 2)
    });
  }
  async updateMarket() {
    const market = await getDAIBTCMarket(provider);
    this.setState({
      market
    });
  }
  async getTradeDetails() {
    if (!this.state.value || !String(this.state.value).trim()) return await this.initializeMarket();
    await this.updateMarket();
//    if (isNaN(toParsed(this.state.value, 'btc'))) return; // just stop here if we have to for some reason
    const trade = await getTradeExecution(provider, this.state.market, toParsed(this.state.value, 'btc'));
    this.setState({
      trade,
      calcValue: toFormat(trade.outputAmount.amount.toString(10), 'dai'),
      rate: util.truncateDecimals(trade.executionRate.rate.toString(10), 2),
      percentage: util.truncateDecimals(trade.marketRateSlippage.toString(10), 4)
    });
  }
  async componentDidMount() {
    await setup;
    if (__IS_TEST) window.alert('initialized!');
    await zero.initializeDriver();
    this.setState({
      selectedAddress: provider.selectedAddress
    });
    await this.initializeMarket();
    globalEthersProvider.on('block', (blockNumber) => {
      console.log('got block -- ' + blockNumber);
      this.getTradeDetails().catch((err) => console.error(err));
      this.getTransfers().catch((err) => console.error(err));
    });
  }
  async getTransfers() {
    const proxies = await getBorrows(zero);
    this.setState({
      proxies
    });
  }
  async requestLoan() {
    const liquidityRequest = zero.createLiquidityRequest(ln({
      token: await getRenBTCAddress(),
      amount: ethers.utils.parseUnits(String(this.state.value), 8),
      nonce: '0x' + randomBytes(32).toString('hex'),
      gasRequested: ethers.utils.parseEther('0.01').toString(),
      actions: createSwapActions({
        borrower: (await (new ethers.providers.Web3Provider(provider)).send('eth_accounts', []))[0],
        dai: contracts.dai,
        factory: contracts.factory
      })
    }));
    const parcel = await liquidityRequest.sign();
    await parcel.broadcast();
    this.setState({
      parcel
    });
    this.setState({ modal: true, waiting: true });
    this.waitOnResult(parcel);
  }
  waitOnResult(parcel) {
    (async () => {
      let proxy;
      const deposited = await getDepositedParcel(parcel);
      this.setState({
        waiting: false
      });
      setTimeout(() => {
        this.setState({
          modal: false
        });
      }, 4000);
      const receipt = await getBorrowProxyCreationReceipt(parcel);
      let amount = getSwapAmountFromBorrowReceipt(receipt, parcel.proxyAddress);
      if (amount) {
        amount = toFormat(amount, 'dai');
        window.alert('BTC/DAI swap executed: ' + util.truncateDecimals(amount, 6) + ' DAI locked -- await RenVM message to release');
      } else {
        window.alert('something went wrong');
      }
      await waitForRepayment(deposited);
      window.alert('RenVM response made it to the network! DAI forwarded to your wallet!');
    })().catch((err) => console.error(err));
  }
  async updateAmount(e) {
    e.preventDefault();
    const value = e.target.value;
    this.setState({
      value
    });
    await this.getTradeDetails();
  }
  render() {
    return (
      <>
        <div style={{minHeight:"100vh", overflowX:"hidden", backgroundColor:"#000000", fontFamily:"Arial"}} className="App pb-5 pt-4 px-5">
          <Modal isOpen={this.state.modal} centered fade style={{minWidth:"50vw"}} toggle={async () => await this.setState({ modal: !this.state.modal })}>
            <ModalBody>
              <div style={{ border: "1px solid #000000" }} className="m-3 py-5">
                <Row className="align-content-center justify-content-center">
                  <h6>Send</h6>
                </Row>
                <Row className="align-content-center justify-content-center">
                  <h4><b>{this.state.value} BTC</b></h4>
                </Row>
                <Row className="align-content-center justify-content-center">
                  <h6>to</h6>
                </Row>
                <Row className="align-content-center justify-content-center mx-auto mb-n3">
                  <p className="text-center text text-break" style={{fontSize:"1.3em"}}>{this.state.parcel && this.state.parcel.depositAddress}</p>
                </Row>
                <Row className="align-content-center justify-content-center mb-5">
                  <h6>to complete swap</h6>
                </Row>
                <Row className="align-content-center justify-content-center">
                  <Col lg="6" className="align-content-center justify-content-center">
                    <button style={{ backgroundColor: "#03007B" }} className="btn p-2 btn-block text-light text-center" onClick={async () => await this.setState({ modal: !this.state.modal })}>{ this.state.waiting && <span>Waiting on BTC</span> || <span>BTC has been sent!</span> }</button>
                  </Col>
                </Row>
              </div>  
            </ModalBody>
          </Modal>
          <div className="align-content-center justify-content-center App pb-5 pt-4 px-5">
            <Row className="align-content-center justify-content-center">
              <h2 className="text-light">BTC-Swap</h2></Row>
            <Row className="align-content-center justify-content-center">
              <p className="text-light"> Trustless, decentralized, immediate swaps from bitcoin ethereum assets </p></Row>
            <Row className="align-content-center justify-content-center">
              <p className="text-light" > <i> powered by </i></p></Row>
              <Row className="align-content-center justify-content-center">
                <Col lg="8" className="align-content-center justify-content-center">
                  <Row className="align-content-center justify-content-center">
                    <Col lg="2"><img src={require("./images/ocf.svg")} alt="0-confirmation" width="70em" /></Col>
                    <Col lg="2"><img src={require("./images/ren.png")} alt="REN-VM" width="150em" /></Col>
                    <Col lg="2"><img src={require("./images/uni.png")} alt="Uni Swap" width="150em" /></Col>
                  </Row>
                </Col>
              </Row>
              <Row className="align-content-center justify-content-center text-light mt-5">
                <Col lg="1"><h2>Swap</h2></Col>
                <Col lg="2"><input placeholder="Input BTC value" style={{ borderBottom: "2px solid #2EDB2F", fontSize: "1em", borderTop: "none", borderRight: "none", borderLeft: "none" }} className="text-center bg-transparent text-light" onChange={async (e) => this.updateAmount(e).catch((err) => console.error(err)) } /></Col>
                <Col lg="2" className="align-content-center justify-content-center text-center"><h2>BTC for</h2></Col>
                <Col lg="2"><h2 className="mb-n1 text-center" style={{ color: "#C3C3C3", fontSize: "1em", borderBottom: "2px solid #C3C3C3" }}>{(isNaN(this.state.calcValue)) ?0: this.state.calcValue}</h2><b style={{ fontSize: "0.7em" }}>current rate:{this.state.rate} {this.state.coin}/BTC</b></Col>
              <Col lg="1">
                <Dropdown isOpen={this.state.menu} toggle={async () => await this.setState({ menu: !this.state.menu })}>
                  <DropdownToggle style={{backgroundColor:"transparent", border:"none"}}>
                    <h2 style={{color: "#2EDB2F" }} className="cursor">{this.state.coin}</h2>
                  </DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"BTC"})}>BTC</DropdownItem>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"ETH"})}>ETH</DropdownItem>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"LTC"})}>LTC</DropdownItem>
                    <DropdownItem onClick={async (e) => await this.setState({coin:"USDT"})}>USDT</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                  {/* <input type="text" style={{backgroundColor:"transparent", border:"none"}} value={this.state.coin}/> */}
                </Col>
              </Row>
              <Row className="align-content-center justify-content-center text-light mt-n1">
                <b style={{ color: "#246525" }}>advanced v</b>
              </Row>
              <Row className="justify-content-center align-content-center mx-auto mt-3">
                <Col lg="6" className="text-center mx-5 h-100" >
                  <Row className="justify-content-center align-content-center mx-5 text-center py-3" style={{ backgroundColor: "#C4C4C4" }}>
                    <Col lg="12" sm="12" md="12">
                    <h5>You are selling <span style={{ color: "#0E3AA9" }}><b>{isNaN(this.state.value) ? 0 : this.state.value}
                    </b></span> <b>BTC</b> for at least <span style={{ color: "#0E3AA9" }}><b>{isNaN(this.state.calcValue) ? '...' : this.state.calcValue}
                      </b></span>  <b>{this.state.coin}</b></h5></Col>
                    <Col lg="12" sm="12" md="12">
                      <h5>Expected Price Slippage: <span style={{ color: "#0E3AA9" }}><b>{this.state.percentage}%
                  </b></span></h5></Col>
                    <Col lg="12" sm="12" md="12">
                      <h6>Additional slippage limit: <span style={{ color: "#0E3AA9" }}><b>{this.state.sliplimit}%
                  </b></span></h6></Col>
                    <Col lg="12" sm="12" md="12"><h6 style={{ color: "#0E3AA9" }}>fee disclosures</h6></Col>
                  </Row>
                </Col>
              </Row>
              <Row className="justify-content-center align-content-center mt-4">
                <Col lg="5" className="text-center">
                  <button style={{ backgroundColor: "#03007B" }} className="btn p-2 btn-block text-light text-center" onClick={ async () => {
                    await this.requestLoan();
                  } }><b>SWAP</b></button>
                </Col>
              </Row>
              <Row className="justify-content-center align-content-center mt-4">
                { this.state.proxies && this.state.proxies.map((v) => <div>{ JSON.stringify(v.pendingTransfers[0]) }</div>) }
              </Row>
          </div>
        </div>
      </>
    );
  }
}
