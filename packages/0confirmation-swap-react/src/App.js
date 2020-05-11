import React, {Fragment} from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import './App.css';
import {
    Row, Col,
    InputGroup,
    InputGroupButtonDropdown,
    Input,
    Modal,
    ModalBody,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from "reactstrap";
import { QRCode } from 'react-qrcode-logo';
import { Link } from "react-router-dom";
import { FaAngleDown } from 'react-icons/fa';
import { InlineIcon } from '@iconify/react';
import btcIcon from '@iconify/icons-cryptocurrency/btc';
import daiIcon from '@iconify/icons-cryptocurrency/dai';
import ltcIcon from '@iconify/icons-cryptocurrency/ltc';
import ethIcon from '@iconify/icons-cryptocurrency/eth';
import usdtIcon from '@iconify/icons-cryptocurrency/usdt';
import eosIcon from '@iconify/icons-cryptocurrency/eos';
import btgIcon from '@iconify/icons-cryptocurrency/btg';
import provider from './provider';
const makePersonalSignProviderFromGanache = require('@0confirmation/providers/ganache');
const makePersonalSignProviderFromPrivate = require('@0confirmation/providers/private-key-or-seed');
const randomBytes = require('random-bytes').sync;
const TransferAll = require('@0confirmation/sol/build/TransferAll');
const SwapEntireLoan = require('@0confirmation/sol/build/SwapEntireLoan');
const ShifterERC20Mock = require('@0confirmation/sol/build/ShifterERC20Mock')
const ShifterRegistryMock = require('@0confirmation/sol/build/ShifterRegistryMock');
const CHAIN = process.env.REACT_APP_CHAIN;
const personalSignProviderFromPrivate = require('@0confirmation/providers/private-key-or-seed');
const web3ProviderFromEthers = require('@0confirmation/providers/from-ethers');
const ethers = require('ethers');
const uniswap = require('@uniswap/sdk');
const util = require('./util');
const uniswapConstants = require('@uniswap/sdk/dist/constants');
const BTCBackend = require('@0confirmation/sdk/backends/btc');
let Zero = require('@0confirmation/sdk');
const { staticPreprocessor } = Zero;
Zero = Zero.ZeroMock;

if (CHAIN === 'embedded' || CHAIN === 'test') Zero = Zero.ZeroMock;

const setupTestUniswapSDK = async (provider) => {
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const chainId = await ethersProvider.send('net_version', []);
  uniswapConstants.FACTORY_ADDRESS[Number(chainId)] = contracts.factory;
  uniswapConstants.SUPPORTED_CHAIN_ID[Number(chainId)] = 'Lendnet';
  uniswapConstants.SUPPORTED_CHAIN_ID.Lendnet = Number(chainId);
  uniswapConstants._CHAIN_ID_NAME[Number(chainId)] = 'lendnet';
};

const encodeAddressPair = (a, b) => ethers.utils.defaultAbiCoder.encode([ 'bytes' ], [ ethers.utils.defaultAbiCoder.encode(['address', 'address'], [ a, b ]) ]);

const createSwapActions = ({
  dai,
  factory,
  borrower,
  swapEntireLoan,
  transferAll
}) => [
  staticPreprocessor(swapEntireLoan.address, encodeAddressPair(factory, dai)),
    
  staticPreprocessor(transferAll.address, encodeAddressPair(dai, borrower))
];

const getRenBTCAddress = async () => {
  return contracts.renbtc || (contracts.renbtc = await getMockRenBTCAddress(new ethers.providers.Web3Provider(provider)));
};

const getDAIBTCMarket = async (provider) => {
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const daiReserves = await uniswap.getTokenReserves(contracts.dai, ethersProvider);
  const btcReserves = await uniswap.getTokenReserves(contracts.renbtc, ethersProvider);
  return await uniswap.getMarketDetails(btcReserves, daiReserves);
};

const getTradeExecution = async (provider, details, amount) => {
  return await uniswap.getTradeDetails(uniswap.TRADE_EXACT.INPUT, amount, details || await getDAIBTCMarket(provider));
};

const getBorrows = async (zero) => {
  const borrowProxies = await zero.getBorrowProxies();
  for (const borrowProxy of borrowProxies) {
    borrowProxy.pendingTransfers = await borrowProxy.queryPendingTransfers();
  }
  return borrowProxies;
};

const { getAddresses } = require('@0confirmation/sdk/environments');
let contracts = getAddresses(CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'testnet');
const mpkh = contracts.mpkh;

const USE_TESTNET_BTC = process.env.USE_TESTNET_BTC || process.env.REACT_APP_USE_TESTNET_BTC;

const makeZero = (provider) => {
  const zero = new Zero(provider);
  if (USE_TESTNET_BTC) zero.driver.registerBackend(new BTCBackend({
    network: 'testnet'
  }));
  return zero;
};

const getMockRenBTCAddress = async (provider, contracts) => {
  const registry = new ethers.Contract(contracts.shifterRegistry, ShifterRegistryMock.abi, provider);
  return await registry.token();
};

const getContractsFromArtifacts = async (artifacts) => ({
  dai: artifacts.require('DAI').address,
  factory: artifacts.require('Factory').address,
  shifterRegistry: artifacts.require('ShifterRegistryMock').address,
  renbtc: await getMockRenBTCAddress(new ethers.providers.Web3Provider(provider), {
    shifterRegistry: artifacts.require('ShifterRegistryMock').address
  }),
  shifterPool: artifacts.require('ShifterPool').address,
  transferAll: artifacts.require('TransferAll'),
  swapEntireLoan: artifacts.require('SwapEntireLoan'),
  mpkh,
  isTestnet: true
});

let zero = makeZero(provider);
const DECIMALS = {
  btc: 8,
  dai: 18
};


class App extends React.Component {
  render() {
    return <div className="App">
      <Router>
        <Switch>
          <Route exact path='/'>
            <Redirect to='/trade' />
          </Route>
          <Route path='/trade' component={TradeRoom} />
        </Switch>
      </Router>
    </div>;
  }
}

const getSwapAmountFromBorrowReceipt = (receipt, address) => {
  const iface = new ethers.utils.Interface(require('@0confirmation/sol/build/DAI').abi);
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

const coerceToDecimals = (nameOrDecimals) => typeof nameOrDecimals === 'string' && isNaN(nameOrDecimals) ? DECIMALS[nameOrDecimals] : Number(nameOrDecimals);

const toFormat = (v, decimals) => util.truncateDecimals(ethers.utils.formatUnits(v, coerceToDecimals(decimals)), 4);

const toParsed = (v, decimals) => ethers.utils.parseUnits(v, coerceToDecimals(decimals));

let artifacts;

const defer = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    resolve,
    reject,
    promise
  };
};

const contractsDeferred = defer();

class TradeRoom extends React.Component {
    async setup() {
      if (provider.migrate) {
        artifacts = await provider.migrate();
        contracts = await getContractsFromArtifacts(artifacts);
        const pvt = randomBytes(32).toString('hex');
        provider.setSigningProvider(provider.makeFauxMetamaskSigner(makePersonalSignProviderFromPrivate(pvt, provider.dataProvider), window.ethereum));
        zero = makeZero(provider);
      }
      zero.setEnvironment(contracts);
      await setupTestUniswapSDK(provider);
      if (!['embedded', 'test'].includes(CHAIN)) return;
      const ganacheAddress = (await (provider.dataProvider.asEthers()).send('eth_accounts', []))[0];
      const keeperPvt = ethers.utils.solidityKeccak256(['address'], [ ganacheAddress ]).substr(2);
      const keeperProvider = personalSignProviderFromPrivate(keeperPvt, provider.dataProvider);
      const keeperEthers = keeperProvider.asEthers();
      const [ keeperAddress ] = await keeperEthers.send('eth_accounts', []);
      console.log('initializing mock keeper at: ' + keeperAddress);
      if ((Number(await (keeperProvider.asEthers()).send('eth_getBalance', [ keeperAddress, 'latest' ]))) < Number(ethers.utils.parseEther('9'))) {
        console.log('this keeper needs ether! sending 10');
        const sendEtherTx = await (provider.dataProvider.asEthers()).send('eth_sendTransaction', [{
          value: ethers.utils.hexlify(ethers.utils.parseEther('10')),
          gas: ethers.utils.hexlify(21000),
          gasPrice: '0x01',
          to: keeperAddress,
          from: ganacheAddress
        }]);
        await (provider.asEthers()).waitForTransaction(sendEtherTx);
        console.log('done!');
      }
      const renbtcWrapped = new ethers.Contract(contracts.renbtc, ShifterERC20Mock.abi, keeperEthers.getSigner());
      console.log('minting 10 renbtc for keeper --');
      await (await renbtcWrapped.mint(keeperAddress, ethers.utils.parseUnits('100', 8))).wait();
      console.log('done!');
      const keeperZero = makeZero(keeperProvider);
      keeperZero.setEnvironment(contracts);
      keeperZero.connectMock(zero);
      await (await keeperZero.approveLiquidityToken(contracts.renbtc)).wait();
      await (await keeperZero.addLiquidity(contracts.renbtc, ethers.utils.parseUnits('50', 8))).wait();
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
        console.logKeeper('found deposit -- initializing a borrow proxy!')
        const bond = ethers.utils.bigNumberify(v.amount).div(9);
        console.log((await (new ethers.Contract(deposited.token, ShifterERC20Mock.abi, keeperEthers.getSigner())).balanceOf(keeperAddress)).toString());
        const receipt = await (await deposited.executeBorrow(bond, '100000')).wait();
        const result = await deposited.submitToRenVM();
        const sig = await deposited.waitForSignature();
        try {
          const borrowProxy = await deposited.getBorrowProxy();
          console.logKeeper('waiting for renvm ...');
          await new Promise((resolve, reject) => setTimeout(resolve, 60000));
          console.logKeeper('repaying loan for ' + deposited.proxyAddress + ' !');
          await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) });
        } catch (e) {
          console.logKeeper('error');
          console.error(e);
        }
      });
      contractsDeferred.resolve(contracts);
    }
    async componentDidMount() {
        await this.setup();
    }
    constructor(props) {
        super(props)

        this.state = {
            showdetail: true,
            sendOpen:false,
            getOpen: false,
            send: 0,
            get: 0,
            rate: '0',
            getvalue: 0,
            slippage:0.5,
            calcValue: 0,
            _getcoins: 
                { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={daiIcon} /></Fragment>, id: 0, name: "DAI" },
            _sendcoins:
                { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btcIcon} /></Fragment>, id: 0, name: "BTC" },
             
        }
        this.setsend = this.setsend.bind(this);
        this.setget = this.setget.bind(this);
    }
    setget (a) {
        alert(a)
    }

    setsend(a) {
        alert(a)
    }
    async initializeMarket() {
      await this.updateMarket();
      this.setState({
        rate: util.truncateDecimals(this.state.market.marketRate.rate.toString(10), 2)
      });
    }
    async updateAmount(e) {
      e.preventDefault();
      const value = e.target.value;
      this.setState({
        value
      });
      await this.getTradeDetails();
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
        slippage: util.truncateDecimals(trade.marketRateSlippage.toString(10), 4)
      });
    }
    async requestLoan(evt) {
      evt.preventDefault();
      const contracts = await contractsDeferred.promise;
      console.log(await (provider.asEthers()).send('eth_getCode', [ contracts.transferAll.address, 'latest' ]));
      console.log(await (provider.asEthers()).send('eth_getCode', [ contracts.swapEntireLoan.address, 'latest' ]));
      const liquidityRequest = zero.createLiquidityRequest({
        token: await getRenBTCAddress(),
        amount: ethers.utils.parseUnits(String(this.state.value), 8),
        nonce: '0x' + randomBytes(32).toString('hex'),
        gasRequested: ethers.utils.parseEther('0.01').toString(),
        actions: createSwapActions({
          borrower: (await (new ethers.providers.Web3Provider(provider)).send('eth_accounts', []))[0],
          dai: contracts.dai,
          factory: contracts.factory,
          transferAll: contracts.transferAll,
          swapEntireLoan: contracts.swapEntireLoan
        })
      });
      const parcel = await liquidityRequest.sign();
      console.log(parcel.proxyAddress);
      await parcel.broadcast();
      this.setState({
        parcel,
        modal: true,
        waiting: true
      });
      this.waitOnResult(parcel);
    }
    async getDepositedParcel(parcel) {
      return await parcel.waitForDeposit();
    }
    async waitOnResult(parcel) {
      (async () => {
        let proxy;
        const deposited = await this.getDepositedParcel(parcel);
        this.setState({
          waiting: false
        });
        proxy = await this.getBorrowProxy(parcel);
        const receipt = await proxy.getTransactionReceipt();
        this.setState({
          modal: false
        });
        let amount = getSwapAmountFromBorrowReceipt(receipt, deposited.proxyAddress);
        if (amount) {
          amount = toFormat(amount, 'dai');
          window.alert('BTC/DAI swap executed: ' + util.truncateDecimals(amount, 6) + ' DAI locked -- await RenVM message to release');
        } else {
          window.alert('something went wrong');
        }
        if (CHAIN === 'embedded' || CHAIN === 'test') await new Promise((resolve, reject) => setTimeout(resolve, 60000));
        await this.waitForRepayment(deposited);
        window.alert('RenVM response made it to the network! DAI forwarded to your wallet!');
      })().catch((err) => console.error(err));
    }
    async waitForRepayment(deposited) {
      return await deposited.waitForSignature(); // this one needs to be fixed for mainnet
    }
    async getBorrowProxy(parcel) {
      while (true) {
        const proxy = await parcel.getBorrowProxy();
        if (proxy) return proxy;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } // fix this so it returns a receipt
    }
    _send = 0;
    _get = 0;
    _coin = <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btcIcon} /></Fragment>
    _coins = [
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btcIcon} /></Fragment>,id:0, name: "BTC" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={daiIcon} /></Fragment>,id:1, name: "DAI" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={ltcIcon} /></Fragment>,id:2, name: "LTC" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={ethIcon} /></Fragment>,id:3, name: "ETH" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={usdtIcon} /></Fragment>,id:4, name: "USDT"},
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={eosIcon} /></Fragment>,id:5, name: "EOS" },
        { coin: <Fragment><InlineIcon color="#ffffff" style={{fontSize:"1.5em"}} className="mr-2" icon={btgIcon} /></Fragment>,id:6, name: "BTG" },
    ];
    render() {
        const closeBtn = <button className="btn" style={{ color: "#317333" }} onClick={ async ()=> await this.setState({modal:!this.state.modal})}>&times;</button>;
        return (
          <>
                <Modal
                    style={{ overflowX: "hidden"}}
                    className="dmodal"
                    wrapClassName="dmodal"
                    modalClassName="dmodal"
                    backdropClassName="dmodal"
                    contentClassName="dmodal"                    centered isOpen={this.state.modal} 
                    toggle={async () => await this.setState({ modal: !this.state.modal })}>
                    <ModalBody style={{ backgroundColor: "#1f2820" }} className="h-100" >
                            <Row className="w-100 align-content-center justify-content-center my-3">
                                <Col lg="10" sm="10" md="10" className="align-content-center justify-content-center text-center">
                                    <span style={{ fontSize: "1.7em", fontFamily:"PT Sans", fontWeight:"bolder" }}
                                        className="mx-auto align-content-center justify-content-center text-center text-light ml-3">
                                        Bitcoin Payment
                                </span>
                                </Col>
                                <Col lg="1" sm="1" md="1">{closeBtn}</Col>
                        </Row>
                        <Row className="w-100 align-content-center justify-content-center text-center text-light">
                            <Col lg="12" sm="12" md="12" style={{fontSize:"0.9em"}} className="align-content-center justify-content-center text-center text-light">
                                You are selling <b>{this.state.value} {this.state._sendcoins.name}</b> for at least <b>{this.state.calcValue} {this.state._getcoins.name}</b><br/>
                                Expected Price Slippage: <b>{this.state.slippage}%</b><br />
                                Additional slippage limit: <b>{this.state.slippage}%</b>
                            </Col>
                        </Row>
                        <Row className="my-3 align-content-start justify-content-start">
                            <Col lg="3" md="3" sm="3"
                                className="text-light text-center align-content-start justify-content-start">
                                <QRCode value={this.state.parcel && this.state.parcel.depositAddress}
                                    fgColor="#317333"
                                    logoHeight={30}
                                    logoWidth={30}
                                    logoOpacity={0.2}
                                    logoImage={require("./images/0cf.svg")}
                                    size={100} bgColor="transparent"
                                    qrStyle="squares" />
                                {/* <img src={require("../images/barcode.svg")} alt="0CF" className="img-fluid" /> */}
                            </Col>
                            <Col lg="9" md="9" sm="9" className="align-content-start justify-content-start">
                                <Row style={{ border: "2px solid #317333", borderRadius: "10px" }}
                                    className="text-light mx-1 h-100 text-center align-content-center justify-content-center">
                                    <Col lg="12" md="12" sm="12" className="text-light text-center align-content-center justify-content-center">
                                        <span style={{ fontSize: "0.7em" }}>To complete payment, send 0.1 BTC to the below address</span>
                                    </Col>
                                    <Col lg="12" md="12" sm="12" className="text-light text-center align-content-center justify-content-center">
                                        <span className="mx-1" style={{
                                            fontSize: "0.79em", letterSpacing: "0.03em", color: "#137333",
                                            
                                        }}>
                                            <b className="mr-1 pb-3"
                                                style={{ borderBottom: "1px solid #137333 "}}
                                            >{this.state.parcel && this.state.parcel.depositAddress}</b>
                                            {(this.state.copied)?
                                                <b style={{ fontSize: "0.79em", letterSpacing: "0.03em", color: "#137333" }}>Copied!</b>
                                                :<img
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // e.clipboardData.setData('text/plain', this.state.wallet);
                                                        navigator.clipboard.writeText(this.state.parcel && this.state.parcel.depositAddress);
                                                    this.setState({copied:true})
                                                }}
                                                style={{ cursor: "pointer" }} className="img-fluid" src={require("./images/copy.svg")} alt="Copy" />}</span>
                                    </Col>
                                    <Col lg="12" md="12" sm="12" className="text-light my-3 mx-1 text-center align-content-center justify-content-center">
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row className="align-content-center justify-content-center mt-4 mb-5 text-center text-light">
                            <Col lg="8" sm="8" md="8" style={{ fontSize: "0.9em" }} className="align-content-center justify-content-center">
                                <button className="btn btn-block rounded-pill bg-danger text-center text-light">
                                    Payment Sent
                                </button>
                            </Col>
                        </Row>
                        </ModalBody>
                </Modal>
                <div className="justify-content-center align-content-center pt-5" style={{overflowX:"hidden"}} >
                    <div className="justify-content-center align-content-center text-center mx-auto my-auto pb-4 pt-5">
                        <button className="btn text-light button-small btn-sm" style={{ fontSize: "24dp", backgroundColor: "#317333", width: "248dp", borderRadius: "10px" }} onClick={ (evt) => { evt.preventDefault(); if (window.ethereum) window.ethereum.enable() } }>Connect Wallet</button>
                    </div>
                    <Row className="justify-content-center align-content-center text-center mx-auto">
                        <Col lg="2" md="2" sm="6" className="justify-content-center align-content-center mx-auto w-50" style={{ backgroundColor: "#1F2820", borderRadius: "10px"}}>
                            <Row className="justify-content-center align-content-center p-1 text-light">
                                <Col className="justify-content-center align-content-center py-1" lg="6" md="6" sm="6" style={{ borderRadius: (this.props.ismobile)? "0px":"13px",backgroundColor: (window.location.pathname.split("/")[2] === "swap") ? "#317333" : "" }}>
                                    <Link to="/trade/swap" style={{ outline: "none", textDecoration: "none", color: "#ffffff" }} href="/#">Swap</Link>
                                </Col>
                                <Col className="justify-content-center align-content-center py-1" lg="6" md="6" sm="6" style={{ borderRadius: (this.props.ismobile)? "0px":"13px",backgroundColor: (window.location.pathname.split("/")[2] === "earn") ? "#317333" : "" }}>
                                 <Link to="/trade/earn" style={{ outline: "none", textDecoration: "none", color: "#ffffff" }} href="/#"

                                    >Earn</Link>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row className="justify-content-center align-content-center text-center mx-auto my-1">
                        {(window.location.pathname.split("/")[2] === "earn")?null:<Col lg="6" md="6" sm="6">
                            <Link to="/" style={{ outline: "none", textDecoration: "none", borderBottom: "1px solid #317333", color: "#317333", fontSize:"0.8em", fontStyle:"normal", fontWeight:"bold" }} href="/#"

                            >Recent Transactions</Link>
                        </Col>}
                    </Row>
                    <Row  className="justify-content-center align-content-center text-center">
                        <Col lg="8" md="8" sm="8" style={{ backgroundColor:"#1F2820", borderRadius:"10px 10px 0px 0px", minHeight:"70vh"}} className="shadow-lg mx-4">

                            <Row className="justify-content-center align-content-center text-center mx-auto mt-3">
                                {(window.location.pathname.split("/")[2] === "earn") ?
                                    <Col lg="6" md="6" sm="6">
                                        <p style={{ fontWeight: "bold", fontStyle: "normal", fontSize: "2em", fontFamily: "PT Sans", color: "#ffffff" }}>0cf Earn</p>
                                    </Col>
                                    :
                                    <Col lg="6" md="6" sm="6">
                                    <p style={{fontWeight:"bold", fontStyle:"normal", fontSize:"2em", fontFamily:"PT Sans", color:"#ffffff"}}>0cf Swap</p>
                                </Col>}
                            </Row>
                            <Row className="justify-content-center align-content-center text-center mx-auto">
                                {(window.location.pathname.split("/")[2] === "earn") ?
                                    <Col lg="12" md="12" sm="12">
                                        <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                            Add BTC to the 0cf pool to gain interest on short term liquidity loans
                                    </p>
                                    </Col>
                                    :
                                    <Col lg="12" md="12" sm="12">
                                    <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                        Instantly Swap BTC for ETH assets using decentralized exchanges
                                    </p>
                                </Col>}
                            </Row>
                           { (window.location.pathname.split("/")[2] === "earn") ?
                                <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">
                                <Col lg="4" md="12" sm="12" className="mt-2">
                                    <InputGroup style={{height:"52px"}}> 
                                        <Input type="text"
                                        value={this.state.value} onChange={ (evt) => this.updateAmount(evt) }
                                        className="sendcoin h-100" style={{backgroundColor:"#354737",
                                        borderRadius:"8px 0px 0px 8px", color:"#ffffff", border:"none", outline:"none"}} />
                                        <InputGroupButtonDropdown style={{backgroundColor:"#354737",borderRadius:"0px 8px 8px 0px", color:"#ffffff"}} direction="right" setActiveFromChild={true} addonType="append" isOpen={this.state.sendOpen} toggle={async (e) => await this.setState({ sendOpen: !this.state.sendOpen})}>
                                            <DropdownToggle style={{backgroundColor:"#485F4B", borderRadius:"0px 8px 8px 0px", color:"#ffffff", border:"none", outline:"none"}}>
                                                {this.state._sendcoins.coin}{' '} 
                                                {this.state._sendcoins.name}{' '}<FaAngleDown />
                                            </DropdownToggle>
                                            <DropdownMenu style={{ backgroundColor:"#354737", borderRadius:"8px 8px 8px 8px", color:"#ffffff", border:"none", outline:"none", marginTop:"3.5em", marginLeft:"-10em"}}>
                                                {this._coins.map((a,i)=> {
                                                    return (
                                                        <DropdownItem key={i} className="dhover" style={{ color: "#ffffff", backgroundColor: (this.state.send === a.id) ?"#485F4B":""}}
                                                            // onClick={() => { this._send = i; alert(this._send)}}
                                                            onClick={(i) => { this.setState({ send: a.id, _sendcoins:{name:a.name, id:a.id, coin:a.coin} }) }}
                                                        >
                                                            {a.coin}{a.name}</DropdownItem>
                                                    );
                                                })}
                                                {/* active={(a.id === this.state.send) ? true : false}  async ()=> await this.setState({send:a.id})*/}
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col></Row>
                                :
                                <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">

                                <Col lg="4" md="12" sm="12" className="mt-2">
                                    <InputGroup style={{height:"52px"}}> 
                                        <Input type="text"
                                        value={this.state.value} onChange={ (evt) => this.updateAmount(evt) } 
                                        className="sendcoin h-100" style={{backgroundColor:"#354737",
                                        borderRadius:"8px 0px 0px 8px", color:"#ffffff", border:"none", outline:"none"}} />
                                        <InputGroupButtonDropdown style={{backgroundColor:"#354737",borderRadius:"0px 8px 8px 0px", color:"#ffffff"}} direction="right" setActiveFromChild={true} addonType="append" isOpen={this.state.sendOpen} toggle={async (e) => await this.setState({ sendOpen: !this.state.sendOpen})}>
                                            <DropdownToggle style={{backgroundColor:"#485F4B", borderRadius:"0px 8px 8px 0px", color:"#ffffff", border:"none", outline:"none"}}>
                                                {this.state._sendcoins.coin}{' '} 
                                                {this.state._sendcoins.name}{' '}<FaAngleDown />
                                            </DropdownToggle>
                                            <DropdownMenu style={{ backgroundColor:"#354737", borderRadius:"8px 8px 8px 8px", color:"#ffffff", border:"none", outline:"none", marginTop:"3.5em", marginLeft:"-10em"}}>
                                                {this._coins.map((a,i)=> {
                                                    return (
                                                        <DropdownItem key={i} className="dhover" style={{ color: "#ffffff", backgroundColor: (this.state.send === a.id) ?"#485F4B":""}}
                                                            // onClick={() => { this._send = i; alert(this._send)}}
                                                            onClick={(i) => { this.setState({ send: a.id, _sendcoins:{name:a.name, id:a.id, coin:a.coin} }) }}
                                                        >
                                                            {a.coin}{a.name}</DropdownItem>
                                                    );
                                                })}
                                                {/* active={(a.id === this.state.send) ? true : false}  async ()=> await this.setState({send:a.id})*/}
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col>
                                <Col lg="2" md="6" sm="6" className="mt-2">
                                    <img className="img-fluid" src={require("./images/swapicon.svg")} alt="Swap"/>
                                </Col>
                                <Col lg="4" md="12" sm="12" className="mt-2">
                                    <InputGroup style={{height:"52px"}}> 
                                        <Input readonly="readonly" type="text"
                                            value={this.state.calcValue}
                                            // value={this.state.getvalue}
                                            onChange={event => event.preventDefault() }
                                        className="getcoin h-100"  style={{backgroundColor:"#354737",
                                        borderRadius:"8px 0px 0px 8px", color:"#ffffff", border:"none", outline:"none"}}/>
                                        <InputGroupButtonDropdown style={{backgroundColor:"#354737",borderRadius:"0px 8px 8px 0px", color:"#ffffff"}} direction="right" setActiveFromChild={true} addonType="append" isOpen={this.state.getOpen} toggle={async (e) => await this.setState({ getOpen: !this.state.getOpen })}>
                                            <DropdownToggle style={{backgroundColor:"#485F4B", borderRadius:"0px 8px 8px 0px", color:"#ffffff", border:"none", outline:"none"}}>

                                                {this.state._getcoins.coin}{' '}
                                                {this.state._getcoins.name}{' '}<FaAngleDown />
                                            </DropdownToggle>
                                            <DropdownMenu style={{ backgroundColor: "#354737", borderRadius: "8px 8px 8px 8px", color: "#ffffff", border: "none", outline: "none", marginTop: "3.5em", marginLeft: "-10em" }}>

                                                {this._coins.map( (a, i)=> {
                                                    return (
                                                        <DropdownItem key={i} className="dhover" style={{ color: "#ffffff", backgroundColor: (this.state.get === a.id) ? "#485F4B" : "" }}
                                                            // onClick={() => {this._get = i; alert(this._get)}}
                                                            onClick={(i) => { this.setState({ get: a.id, _getcoins: { name: a.name, id: a.id, coin: a.coin } }) }}
                                                        >
                                                            {a.coin}<tab/> {a.name}</DropdownItem>
                                                    );
                                                })}
                                                {/* active = {(a.id === this.state.get) ? true : false  async (e) => await this.setState({ get: a.id })*/}
                                            </DropdownMenu>
                                        </InputGroupButtonDropdown>
                                    </InputGroup>
                                </Col>
                            </Row>}
                            
                            <div className="justify-content-center align-content-center text-center mx-auto my-auto pt-3">
                                {(window.location.pathname.split("/")[2] === "earn") ?
                                    <button className="btn text-light button-small btn-sm px-5" style={{ fontSize: "24dp", backgroundColor: "#317333", borderRadius: "10px" }}>Pool</button>
                                :
                                    <button onClick={ (evt) => this.requestLoan(evt) } className="btn text-light button-small btn-sm px-5" style={{ fontSize: "24dp", backgroundColor: "#317333", borderRadius: "10px" }}>Swap</button>
                                }
                            </div>
                            <Row className="justify-content-center align-content-center text-center mx-auto py-3">
                                <Col lg="6" md="6" sm="6">
                                    <span onClick={async (e) => await this.setState({ showdetail: !this.state.showdetail })} className="text-light" style={{ fontWeight: "normal", cursor:"pointer", fontStyle: "normal", fontSize: "0.7em", fontFamily: "PT Sans", color: "#ffffff" }}>Details <FaAngleDown/></span>
                                </Col>
                            </Row>
                            {(this.state.showdetail)?
                                <Row className="justify-content-center align-content-center text-center mx-auto mt-1 mb-5">
                                    
                                    {(window.location.pathname.split("/")[2] === "earn") ?
                                    <Col lg="9" md="9" sm="9" style={{ backgroundColor: "#354737", borderRadius: "10px" }} className="shadow-lg mx-4  py-3">
                                        <Row className="justify-content-center align-content-center">
                                                <Col sm="7" lg="7" md="7">
                                                    <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                                        {this.state.value} {this.state._sendcoins.name} has historic returns of 23.2% APY or .0232 BTC interest per year
                                                    </p>
                                                </Col>
                                                <Col sm="12" lg="12" md="12">
                                                    <Row>
                                                        <Col className="text-light align-content-start justify-content-start" sm="6" lg="6" md="6">
                                                            <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>Current Pool Size</p>
                                                        </Col>
                                                        <Col className="text-light align-content-end justify-content-end" sm="6" lg="6" md="6">
                                                            <p style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>450.392 BTC</p>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                        </Row>
                                    </Col>
                                    :
                                    <Col lg="9" md="9" sm="9" style={{ backgroundColor: "#354737", borderRadius: "10px" }} className="shadow-lg mx-4  py-3">
                                            <Row className="align-content-center justify-content-center">
                                                <Col lg="7" md="7" sm="7" className="justify-content-center align-content-center">
                                                    <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                                        You are selling <b>{this.state.value} {this.state._sendcoins.name}</b> for at least <b>{this.state.calcValue} {this.state._getcoins.name}</b> Expected Price Slippage: <b>{this.state.slippage}%</b>  Additional slippage limit: <b>{this.state.slippage}%</b> fee disclosures
                                                    </p>
                                                </Col>
                                        </Row>
                                    {/* <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                        You are selling <b>{this.state.sendvalue} {this.state._sendcoins.name}</b> for at least <b>{this.state.sendvalue * this.state.rate} {this.state._getcoins.name}</b> <br />Expected Price Slippage: <b>{this.state.slippage}%</b>  <br />Additional slippage limit: <b>{this.state.slippage}%</b>  <br />fee disclosures
                                    </p> */}
                                        </Col>
                                    }
                                </Row>
                                : null
                            }
                        </Col>
                    </Row>
                </div>
            </>
        );
    }
}

export default App;
