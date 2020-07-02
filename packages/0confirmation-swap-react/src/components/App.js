import React, { useState, useEffect, Fragment } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import BigNumber from "bignumber.js";
import { noop } from "lodash";
import { InlineIcon } from "@iconify/react";
import swapIconSvg from "../images/swapicon.svg";
import { chainIdToName, DECIMALS } from "../lib/utils";
import ERC20 from "../lib/erc20";
import * as bitcoin from '../lib/bitcoin-helpers';
import { getSvgForConfirmations } from "../lib/confirmation-image-wheel";
import "./App.css";
import {
  Row,
  Col,
  InputGroup, InputGroupText,
  InputGroupButtonDropdown, InputGroupAddon,
  Input,
  Dropdown,
  Table,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,ButtonDropdown
} from "reactstrap";
import LoanModal from "./LoanModal";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { Link } from "react-router-dom";
import { FaAngleDown } from "react-icons/fa";
import btcIcon from "@iconify/icons-cryptocurrency/btc";
import daiIcon from "@iconify/icons-cryptocurrency/dai";
import Alert from "./Alert";
import { Web3Provider } from "@ethersproject/providers";
import provider from "../lib/provider";
import Web3Modal from "web3modal";
import Fortmatic from "fortmatic";
import setupTestUniswapSDK from "../lib/uniswap";
import makePersonalSignProviderFromPrivate from "@0confirmation/providers/private-key-or-seed";
import { sync as randomBytes } from "random-bytes";
import ShifterERC20Mock from "@0confirmation/sol/build/ShifterERC20Mock";
import ShifterRegistryMock from "@0confirmation/sol/build/ShifterRegistryMock";
import personalSignProviderFromPrivate from "@0confirmation/providers/private-key-or-seed";
import { ethers } from "ethers";
import * as swap from "../lib/swap";
import * as utils from "../lib/utils";
import * as record from "../lib/record";
import * as persistence from "../lib/persistence";
import BTCBackend from "@0confirmation/sdk/backends/btc";
import { getAddresses } from "@0confirmation/sdk/environments";
import Zero from "@0confirmation/sdk";
import {
  ChainId,
  Pair,
  Route as UniRoute,
  Token,
  Trade,
  TokenAmount,
  TradeType,
} from "@uniswap/sdk";
import { abi as ERC20ABI } from "@0confirmation/sol/build/DAI";
const CHAIN = process.env.REACT_APP_CHAIN; // eslint-disable-line

if (window.ethereum) window.ethereum.autoRefreshOnNetworkChange = false;

let cachedBtcBlock = 0;

const web3Modal = new Web3Modal({
  network: utils.chainIdToName(process.env.REACT_APP_CHAIN || "1"), // eslint-disable-line
  cacheProvider: true,
  providerOptions: {
    fortmatic: {
      package: Fortmatic,
      options: {
        key:
          process.env.REACT_APP_CHAIN !== "1" // eslint-disable-line
            ? "pk_test_3902D9F5B6E65695"
            : "pk_live_0B4E40B1BB9C11E7",
      },
    },
  },
});

const getRenBTCAddress = async () => {
  return (
    contracts.renbtc ||
    (contracts.renbtc = await getMockRenBTCAddress(
      new ethers.providers.Web3Provider(provider)
    ))
  );
};

const getDAIToken = () =>
  new Token(
    ChainId.MAINNET,
    contracts.dai,
    DECIMALS.dai,
    "DAI",
    "DAI Stablecoin"
  );
const getRenBTCToken = () =>
  new Token(
    ChainId.MAINNET,
    contracts.renbtc,
    DECIMALS.btc,
    "RenBTC",
    "RenBTC"
  );
const getWETHToken = () =>
  new Token(ChainId.MAINNET, contracts.weth, DECIMALS.weth, "WETH", "WETH");

const getDAIBTCMarket = async (provider) => {
  const route = new UniRoute(
    [
      await Pair.fetchData(getRenBTCToken(), getWETHToken(), provider),
      await Pair.fetchData(getDAIToken(), getWETHToken(), provider),
    ],
    getRenBTCToken()
  );
  return route;
};

const getTradeExecution = async (provider, route, amount) => {
  return new Trade(
    route || (await getDAIBTCMarket(provider)),
    new TokenAmount(getRenBTCToken(), amount),
    TradeType.EXACT_INPUT
  );
};

const getBorrows = async (zero) => {
  const borrowProxies = await zero.getBorrowProxies();
  for (const borrowProxy of borrowProxies) {
    borrowProxy.pendingTransfers = await borrowProxy.queryTransfers();
  }
  return borrowProxies;
};

let contracts = getAddresses(
  CHAIN === "1" ? "mainnet" : CHAIN === "42" ? "testnet" : "testnet"
);
const mpkh = contracts.mpkh;

const USE_TESTNET_BTC =
  process.env.USE_TESTNET_BTC || process.env.REACT_APP_USE_TESTNET_BTC; // eslint-disable-line

const makeZero = (provider) => {
  const zero = ["test", "external"].includes(CHAIN)
    ? new Zero.ZeroMock(provider)
    : new Zero(
        provider,
        CHAIN === "42" ? "testnet" : CHAIN === "1" ? "mainnet" : "ganache"
      );
  if (USE_TESTNET_BTC)
    zero.driver.registerBackend(
      new BTCBackend({
        network: "testnet",
      })
    );
  return zero;
};

const getMockRenBTCAddress = async (provider, contracts) => {
  const registry = new ethers.Contract(
    contracts.shifterRegistry,
    ShifterRegistryMock.abi,
    provider
  );
  return await registry.token();
};

const getContractsFromArtifacts = async (artifacts) => ({
  dai: artifacts.require("DAI").address,
  router: artifacts.require("UniswapV2Router01").address,
  factory: artifacts.require("UniswapV2Factory").address,
  shifterRegistry: artifacts.require("ShifterRegistryMock").address,
  renbtc: await getMockRenBTCAddress(
    new ethers.providers.Web3Provider(provider),
    {
      shifterRegistry: artifacts.require("ShifterRegistryMock").address,
    }
  ),
  shifterPool: artifacts.require("ShifterPool").address,
  swapAndDrop: artifacts.require("V2SwapAndDrop").address,
  weth: artifacts.require("WETH9").address,
  mpkh,
  isTestnet: true,
});

let zero = makeZero(provider);

const App = () => {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/">
            <Redirect to="/trade/swap" />
          </Route>
          <Route path="/trade" component={TradeRoom} />
        </Switch>
      </Router>
    </div>
  );
};

let artifacts;

const contractsDeferred = utils.defer();
const pvt = randomBytes(32).toString("hex");
const makeTestWallet = (proxyTarget) =>
  provider.makeFauxMetamaskSigner(
    makePersonalSignProviderFromPrivate(pvt, provider.dataProvider),
    proxyTarget
  );

const TradeRoom = (props) => {
  const { ismobile } = props;
  const [userAddress, setUserAddress] = useState(ethers.constants.AddressZero);
  const setup = async () => {
    if (provider.migrate) {
      artifacts = await provider.migrate();
      contracts = await getContractsFromArtifacts(artifacts);
      provider.setSigningProvider(makeTestWallet(window.ethereum || provider));
    }
    zero.setEnvironment(contracts);
    if (!["embedded", "test"].includes(CHAIN)) return;
    const ganacheAddress = (
      await provider.dataProvider.asEthers().send("eth_accounts", [])
    )[0];
    const keeperPvt = ethers.utils
      .solidityKeccak256(["address"], [ganacheAddress])
      .substr(2);
    const keeperProvider = personalSignProviderFromPrivate(
      keeperPvt,
      provider.dataProvider
    );
    const keeperEthers = keeperProvider.asEthers();
    const [keeperAddress] = await keeperEthers.send("eth_accounts", []);
    console.log("initializing mock keeper at: " + keeperAddress);
    if (
      Number(
        await keeperProvider
          .asEthers()
          .send("eth_getBalance", [keeperAddress, "latest"])
      ) < Number(ethers.utils.parseEther("9"))
    ) {
      console.log("this keeper needs ether! sending 10");
      const sendEtherTx = await provider.dataProvider
        .asEthers()
        .send("eth_sendTransaction", [
          {
            value: ethers.utils.hexlify(ethers.utils.parseEther("10")),
            gas: ethers.utils.hexlify(21000),
            gasPrice: "0x01",
            to: keeperAddress,
            from: ganacheAddress,
          },
        ]);
      await provider.asEthers().waitForTransaction(sendEtherTx);
      console.log("done!");
    }
    const renbtcWrapped = new ethers.Contract(
      contracts.renbtc,
      ShifterERC20Mock.abi,
      keeperEthers.getSigner()
    );
    console.log("minting 10 renbtc for keeper --");
    await (
      await renbtcWrapped.mint(keeperAddress, ethers.utils.parseUnits("100", 8))
    ).wait();
    console.log("done!");
    const keeperZero = makeZero(keeperProvider);
    keeperZero.setEnvironment(contracts);
    keeperZero.connectMock(zero);
    await (await keeperZero.approveLiquidityToken(contracts.renbtc)).wait();
    await (
      await keeperZero.addLiquidity(
        contracts.renbtc,
        ethers.utils.parseUnits("50", 8)
      )
    ).wait();
    console.log("shifter pool: " + contracts.shifterPool);
    console.log("renbtc: ", contracts.renbtc);
    await (await keeperZero.approvePool(contracts.renbtc)).wait();
    console.logBold = console.log;
    console.logKeeper = (v) => console.logBold("keeper: " + String(v));
    console.logKeeper("online -- listening for loan requests!");
    keeperZero.listenForLiquidityRequests(async (v) => {
      console.logBold("waiting ..");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.logBold("received liquidity request over libp2p!");
      console.logKeeper("got liquidity request!");
      console.logKeeper(
        "computing BTC address from liquidity request parameters: " +
          v.depositAddress
      );
      console.logKeeper(
        "OK! " +
          v.proxyAddress +
          " is a borrow proxy derived from a deposit of " +
          ethers.utils.formatUnits(v.amount, 8) +
          " BTC at the target address"
      );
      if (Number(ethers.utils.formatEther(v.gasRequested)) > 0.1) {
        console.logKeeper("request is for too much gas -- abort");
        return;
      }
      const deposited = await v.waitForDeposit(0, 60*30*1000);
      console.logKeeper("found deposit -- initializing a borrow proxy!");
      const bond = ethers.utils.bigNumberify(v.amount).div(9);
      await (await deposited.executeBorrow(bond, "100000")).wait();
      await deposited.submitToRenVM();
      await deposited.waitForSignature();
      try {
        const borrowProxy = await deposited.getBorrowProxy();
        console.logKeeper("waiting for renvm ...");
        await new Promise((resolve) => setTimeout(resolve, 60000));
        console.logKeeper("repaying loan for " + deposited.proxyAddress + " !");
        await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) });
      } catch (e) {
        console.logKeeper("error");
        console.error(e);
      }
    });
    contractsDeferred.resolve(contracts);
  };
  useEffect(() => {
    if (!window.ethereum) return;
    const ethersProvider = zero.getProvider().asEthers();
    const listener = async (accounts) => {
      const walletAccounts = await ethersProvider.listAccounts();
      if (accounts[0] === walletAccounts[0]) {
        setShowAlert(true);
        setMessage("MetaMask using new wallet: " + accounts[0]);
        setUserAddress(accounts[0]);
      }
    };
    window.ethereum.on("accountsChanged", listener);
    const networkListener = async () => {
      const metamaskEthersProvider = new ethers.providers.Web3Provider(
        window.ethereum
      );
      const networkId = Number(
        await metamaskEthersProvider.send("net_version", [])
      );
      const walletAccounts = await metamaskEthersProvider.listAccounts();
      const zeroAccounts = await ethersProvider.listAccounts();
      if (
        walletAccounts[0] === zeroAccounts[0] &&
        networkId !== Number(CHAIN)
      ) {
        setShowAlert(true);
        setMessage(
          "MetaMask using network " +
            chainIdToName(String(networkId)) +
            " instead of " +
            chainIdToName(String(CHAIN))
        );
      }
    };
    window.ethereum.on("chainChanged", networkListener);
    return () => {
      window.ethereum.removeListener("accountsChanged", listener);
      window.ethereum.removeListener("chainChanged", networkListener);
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (CHAIN === "test" || CHAIN === "embedded") await setup();
      else {
        if (window.ethereum) provider.setSigningProvider(window.ethereum);
//        if (web3Modal.cachedProvider) await _connectWeb3Modal();
        if (CHAIN === "42")
          await setupTestUniswapSDK(zero.getProvider(), () => contracts);
        await zero.initializeDriver();
        contractsDeferred.resolve(contracts);
        console.log("libp2p: bootstrapped");
      }
      const ethersProvider = zero.getProvider().asEthers();
      let busy = false;
      const listener = async (number) => {
        if (number % 3 && !busy) {
          busy = true;
          try {
            await getPendingTransfers(cachedBtcBlock);
          } catch (e) {
            console.error(e);
          }
          busy = false;
        }
      };
      ethersProvider.on("block", listener);
      const userAddresses = await ethersProvider.listAccounts();
      if (userAddresses) setUserAddress(userAddresses[0]);
      return () => ethersProvider.removeListener("block", listener);
    })().catch((err) => console.error(err));
  }, []);
  const [ btcBlock, setBTCBlock ] = useState(0);
  const getBTCBlock = async () => {
    const blockNumber = (await bitcoin.getLatestBlock());
    cachedBtcBlock = Number(blockNumber);
    setBTCBlock(Number(blockNumber));
  };
  useEffect(() => {
    getBTCBlock().catch((err) => console.error(err));
    const timer = setInterval(getBTCBlock, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    (async () => {
      await getPendingTransfers(btcBlock);
    })().catch((err) => console.error(err));
  }, [userAddress, btcBlock]);
  const [apr, setAPR] = useState("0.00%");
  const [totalLiquidityToken, setTotalLiquidityToken] = useState("0");
  useEffect(() => {
    const ethersProvider = new ethers.providers.Web3Provider(
      zero.getProvider()
    );
    const listener = async () => {
      await contractsDeferred.promise;
      const renbtcWrapped = new ethers.Contract(
        contracts.renbtc,
        ERC20ABI,
        ethersProvider
      );
      const liquidityToken = await zero.getLiquidityTokenFor(contracts.renbtc);
      const poolSize = await renbtcWrapped.balanceOf(liquidityToken.address);
      const offset = await liquidityToken.offset();
      setPool(
        utils.truncateDecimals(
          ethers.utils.formatUnits(poolSize.add(offset), DECIMALS.btc),
          4
        )
      );
      const liquidityTokenBalance = await liquidityToken.balanceOf(
        userAddress || ethers.constants.AddressZero
      );
      const liquidityTokenBalanceFormat = utils.truncateDecimals(
        ethers.utils.formatUnits(liquidityTokenBalance, DECIMALS.btc),
        4
      );
      setShare(liquidityTokenBalanceFormat);
      const totalSupply = await liquidityToken.totalSupply();
      const apr = utils.truncateDecimals(
        new BigNumber(String(poolSize.add(offset)))
          .dividedBy(String(totalSupply))
          .multipliedBy(100)
          .minus(100)
          .toString(),
        4
      );
      const stake = (Number(apr) / 100) * Number(liquidityTokenBalanceFormat);
      setStake(isNaN(stake) ? "0" : stake);
      setTotalLiquidityToken(
        utils.truncateDecimals(
          String(ethers.utils.formatUnits(totalSupply, DECIMALS.btc)),
          4
        )
      );
      setAPR(utils.truncateDecimals(apr, 4) + "%");
    };
    listener().catch((err) => console.error(err));
    ethersProvider.on("block", listener);
    return () => ethersProvider.removeListener("block", listener);
  }, []);
  const getPendingTransfers = async (btcBlock) => {
    const ethersProvider = zero.getProvider().asEthers();
    if (!(await ethersProvider.listAccounts())[0]) return;
    const borrows = await getBorrows(zero);
    const history = borrows.filter(
      (v) => v.pendingTransfers.length === 1 && v.pendingTransfers[0].sendEvent
    );
    const result = [];
    for (const item of history) {
      result.push(await record.getRecord(item, zero, btcBlock));
    }
    setHistory(record.decorateHistory(result));
    return borrows;
  };
  const [liquidityvalue, setLiquidityValue] = useState("Add Liquidity");
  const [parcel, setParcel] = useState(null);
  const [liquidity, setLiquidity] = useState(false);
  const [get, setGet] = useState("0");
  const [pool, setPool] = useState("0");
  const [liquidityTokenSupply, setLiquidityTokenSupply] = useState("0");
  const [showdetail, setShowDetail] = useState(true);
  const [blocktooltip, setBlockTooltip] = useState(false);
  const [share, setShare] = useState("0");
  const [stake, setStake] = useState("0");
  const [sendOpen, setSendOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState("none");
  const [transactionModal, setTransactionModal] = useState(false);
  const [_history, setHistory] = useState(record.decorateHistory([]));
  const [getOpen, setGetOpen] = useState(false);
  const [send, setSend] = useState(0);
  //  const [gets, setGets] = useState(0);
  const [rate, setRate] = useState("0");
  if (rate || setRate) noop(); // eslint silencer
  //  const [getvalue, setGetvalue] = useState(0);
  const [slippage, setSlippage] = useState("0");
  //  const [returnPercentage, setReturnPercentage] = useState(0.232);
  const [modal, setModal] = useState(false);
  const [message, setMessage] = useState("");
  const [value, setValue] = useState("0");
  const [calcValue, setCalcValue] = useState("0");
  const [market, setMarket] = useState(null);
  const [trade, setTrade] = useState(null);
  if (trade || setTrade) noop(); // eslint silencer
  const [_getcoins, setGetcoins] = useState([
    {
      coin: (
        <Fragment>
          <InlineIcon
            color="#ffffff"
            style={{ fontSize: "1.5em" }}
            className="mr-2"
            icon={daiIcon}
          />
        </Fragment>
      ),
      id: 0,
      name: "DAI",
    },
  ]);
  const [_sendcoins, setSendcoins] = useState([
    {
      coin: (
        <Fragment>
          <InlineIcon
            color="#ffffff"
            style={{ fontSize: "1.5em" }}
            className="mr-2"
            icon={btcIcon}
          />
        </Fragment>
      ),
      id: 0,
      name: "BTC",
    },
  ]);
  const [waiting, setWaiting] = useState(true);
  const initializeMarket = async () => {
    await updateMarket();
    setRate("N/A");
  };
  const updateAmount = async (e) => {
    e.preventDefault();
    var checkValueLimit;
    if(e.target.value > 0.00035) checkValueLimit = e.target.value;
    const value = checkValueLimit;
    setValue(value);
    if (isNaN(value)) return;
    await getTradeDetails(value);
  };
  const updateMarket = async () => {
    const market = await getDAIBTCMarket(new Web3Provider(zero.getProvider()));
    setMarket(market);
    return market;
  };
  const getTradeDetails = async (value) => {
    const market = await updateMarket();
    if (Number(value) === 0) {
      setCalcValue("0");
      setRate("0");
      setSlippage("0");
      return;
    }
    //    if (isNaN(toParsed(value, 'btc'))) return; // just stop here if we have to for some reason
    const trade = await getTradeExecution(
      new Web3Provider(zero.getProvider()),
      market,
      utils.toParsed(value, "btc")
    );
    setTrade(trade);
    setCalcValue(utils.truncateDecimals(trade.outputAmount.toExact(), 2));
    setRate(trade.executionPrice.toFixed(2));
    setSlippage(trade.slippage.toFixed(2));
  };
  const addLiquidity = async () => {
    const liquidityToken = await zero.getLiquidityTokenFor(contracts.renbtc);
    const ethersProvider = zero.getProvider().asEthers();
    const renbtcWrapped = new ERC20(contracts.renbtc, ethersProvider);
    const [user] = await ethersProvider.listAccounts();
    const allowance = await renbtcWrapped.allowance(
      user,
      liquidityToken.address
    );
    if (allowance.lt("0x" + "ff".repeat(30))) {
      await renbtcWrapped.approve(
        liquidityToken.address,
        "0x" + "ff".repeat(31)
      );
    }
    await liquidityToken.addLiquidity(
      ethers.utils.parseUnits(value, DECIMALS.btc)
    );
  };
  const removeLiquidity = async () => {
    const liquidityToken = await zero.getLiquidityTokenFor(contracts.renbtc);
    await liquidityToken.removeLiquidity(
      ethers.utils.parseUnits(value, DECIMALS.btc)
    );
  };
  const requestLoan = async (evt) => {
    evt.preventDefault();
    const contracts = await contractsDeferred.promise;
    const liquidityRequest = zero.createLiquidityRequest({
      token: await getRenBTCAddress(),
      amount: ethers.utils.parseUnits(String(value), 8),
      nonce: "0x" + randomBytes(32).toString("hex"),
      gasRequested: ethers.utils.parseEther("0").toString(),
      actions: swap.createSwapActions({
        borrower: (
          await new ethers.providers.Web3Provider(provider).send(
            "eth_accounts",
            []
          )
        )[0],
        dai: contracts.dai,
        router: contracts.router,
        swapAndDrop: contracts.swapAndDrop,
      }),
    });
    const parcel = await liquidityRequest.sign();
    persistence.saveLoan(parcel);
    await parcel.broadcast();
    setParcel(parcel);
    setModal(true);
    setWaiting(true);
    waitOnResult(parcel);
  };
  const waitOnResult = async (parcel) => {
    (async () => {
      let proxy;
      const deposited = await parcel.waitForDeposit(0, 30*60*1000);
      
      setWaiting(false);
      const length = _history.length;
      proxy = await utils.pollForBorrowProxy(deposited);
      setModal(false);
      let proxies = await getPendingTransfers(btcBlock);
      proxy = proxies[proxies.length - 1];
      let amount = String((await record.getRecord(proxy, zero)).value);
      if (amount) {
        setShowAlert(true);
        setMessage(
          `BTC/DAI swap executed: ${amount} DAI locked -- await RenVM message to release`
        );
      } else {
        setShowAlert(true);
        setMessage("something went wrong");
      }
      if (CHAIN === "embedded" || CHAIN === "test" || CHAIN === "external")
        await new Promise((resolve) => setTimeout(resolve, 60000));
      new Promise((resolve) => setTimeout(resolve, 500)).then(async () => {
        setTransactionDetails(length);
        setTransactionModal(true);
      }).catch((err) => console.error(err));
      await waitForRepayment(deposited);
      await getPendingTransfers(btcBlock);
      setShowAlert(true);
      setMessage(
        "RenVM response made it to the network! DAI forwarded to your wallet!"
      );
    })().catch((err) => console.error(err));
  };
  const waitForRepayment = async (deposited) => {
    return await deposited.waitForSignature(); // this one needs to be fixed for mainnet
  };
  const _coins = [
    {
      coin: (
        <Fragment>
          <InlineIcon
            color="#ffffff"
            style={{ fontSize: "1.5em" }}
            className="mr-2"
            icon={btcIcon}
          />
        </Fragment>
      ),
      id: 0,
      name: "BTC",
    },
    {
      coin: (
        <Fragment>
          <InlineIcon
            color="#ffffff"
            style={{ fontSize: "1.5em" }}
            className="mr-2"
            icon={daiIcon}
          />
        </Fragment>
      ),
      id: 1,
      name: "DAI",
    },
  ];
  const connectWeb3Modal = async (evt) => {
    evt.preventDefault();
    web3Modal.clearCachedProvider();
    await _connectWeb3Modal();
  };
  const _connectWeb3Modal = async () => {
    const signingProvider = await web3Modal.connect();
    const [userAddress] = await new ethers.providers.Web3Provider(
      signingProvider
    ).listAccounts();
    if (["test", "embedded", "external"].includes(CHAIN))
      provider.setSigningProvider(makeTestWallet(signingProvider));
    else provider.setSigningProvider(signingProvider);
    setUserAddress(userAddress);
  };
  const closeModal = (evt) => {
    evt.preventDefault();
    if (modal) setModal(false);
    if (transactionModal) setTransactionModal(false);
  };
  return (
    <>
      <LoanModal
        waiting={waiting}
        ismobile={ismobile}
        modal={modal}
        closeModal={closeModal}
        _sendcoins={_sendcoins}
        value={value}
        calcValue={calcValue}
        _getcoins={_getcoins}
        slippage={slippage}
        parcel={parcel}
        transactionModal={transactionModal}
      />

      <div
        className="justify-content-center align-content-center pt-5 swap"
        style={{
          zIndex: "1",
          overflowX: "hidden",
          position: "relative",
          opacity: modal || transactionModal ? "0.1" : "1",
        }}
      >
        <div className="justify-content-center align-content-center text-center mx-auto my-auto pb-4 pt-5">
          {(userAddress != null)?
              <button
                  className="btn text-light button-small btn-sm"
                  style={{
                    fontSize: "24dp",
                    backgroundColor: "#317333",
                    width: "248dp",
                    borderRadius: "10px",
                  }}
                  onClick={(evt) => connectWeb3Modal(evt)}
                >
                    Connect Wallet
                </button>
         
        }
        </div>
        <div className="alert-box">
          {showAlert ? (
            <Alert
              delay={5000}
              boldText="Transaction Detail"
              detailText={message}
              alertType="alert-green"
            />
          ) : null}
        </div>
        <Row className="justify-content-center align-content-center text-center mx-auto">
          <Col
            lg="2"
            md="2"
            sm="6"
            className="justify-content-center align-content-center mx-auto w-50"
            style={{ backgroundColor: "#1F2820", borderRadius: "10px" }}
          >
            <Row className="justify-content-center align-content-center p-1 text-light">
              <Col
                className="justify-content-center align-content-center py-1"
                lg="6"
                md="6"
                sm="6"
                style={{
                  borderRadius: ismobile ? "10px" : "13px",
                  backgroundColor:
                    window.location.pathname.split("/")[2] === "swap"
                      ? "#317333"
                      : "",
                }}
              >
                <Link
                  to="/trade/swap"
                  style={{
                    outline: "none",
                    textDecoration: "none",
                    color: "#ffffff",
                  }}
                  href="/#"
                >
                  Swap
                </Link>
              </Col>
              <Col
                className="justify-content-center align-content-center py-1"
                lg="6"
                md="6"
                sm="6"
                style={{
                  borderRadius: ismobile ? "10px" : "13px",
                  backgroundColor:
                    window.location.pathname.split("/")[2] === "earn"
                      ? "#317333"
                      : "",
                }}
              >
                <Link
                  to="/trade/earn"
                  style={{
                    outline: "none",
                    textDecoration: "none",
                    color: "#ffffff",
                  }}
                  href="/#"
                >
                  Earn
                </Link>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="justify-content-center align-content-center text-center mx-auto my-3"></Row>
        <Row className="justify-content-center align-content-center text-center">
          <Col
            lg="8"
            md="8"
            sm="8"
            style={{
              backgroundColor: "#1F2820",
              borderRadius: "10px 10px 0px 0px",
              minHeight: "70vh",
            }}
            className=" mx-4"
          >
            <Row className="justify-content-center align-content-center text-center mx-auto mt-3">
              {window.location.pathname.split("/")[2] === "earn" ? (
                <Col lg="6" md="6" sm="6">
                  <Row>
                    <Col lg="12" md="12" sm="12">
                      <p
                        style={{
                          fontWeight: "bold",
                          fontStyle: "normal",
                          fontSize: "2em",
                          fontFamily: "PT Sans",
                          color: "#ffffff",
                        }}
                      >
                        0cf Earn
                      </p>
                    </Col>
                    <Col lg="12" md="12" sm="12">
                      <ButtonDropdown
                        className="my-3"
                        isOpen={liquidity}
                        toggle={() => setLiquidity(!liquidity)}
                      >
                        <DropdownToggle
                          style={{
                            width: "11em",
                            padding: "0.200em",
                            backgroundColor: "#485F4B",
                            borderRadius: "8px 8px 8px 8px",
                            color: "#ffffff",
                            border: "none",
                            outline: "none",
                          }}
                        >
                          <span>
                            <span className="mr-1">{liquidityvalue}</span>{" "}
                            <FaAngleDown />
                          </span>
                        </DropdownToggle>
                        <DropdownMenu
                          className="dhover text-light"
                          style={{
                            backgroundColor: "#354737",
                            borderRadius: "0px 0px 8px 8px",
                            color: "#ffffff",
                            border: "none",
                            outline: "none",
                          }}
                        >
                          {["Add Liquidity", "Remove Liquidity"].map((a, i) => {
                            return (
                              <DropdownItem
                                key={i}
                                className="dhover"
                                style={{
                                  color: "#ffffff",
                                  backgroundColor:
                                    liquidityvalue === a ? "#485F4B" : "",
                                }}
                                // onClick={() => { this._send = i; alert(this._send)}}
                                onClick={() => {
                                  setLiquidityValue(a);
                                }}
                              >
                                {a}
                              </DropdownItem>
                            );
                          })}
                        </DropdownMenu>
                      </ButtonDropdown>
                    </Col>
                  </Row>
                </Col>
              ) : (
                <Col lg="6" md="6" sm="6">
                  <p
                    style={{
                      fontWeight: "bold",
                      fontStyle: "normal",
                      fontSize: "2em",
                      fontFamily: "PT Sans",
                      color: "#ffffff",
                    }}
                  >
                    0cf Swap
                  </p>
                </Col>
              )}
            </Row>
            <Row className="justify-content-center align-content-center text-center mx-auto">
              {window.location.pathname.split("/")[2] === "earn" ? (
                <Col lg="12" md="12" sm="12">
                  <p
                    style={{
                      fontWeight: "normal",
                      fontStyle: "normal",
                      fontSize: "0.8em",
                      fontFamily: "PT Sans",
                      color: "#ffffff",
                    }}
                  >
                    Add BTC to the 0cf pool to gain interest on short term
                    liquidity loans
                  </p>
                </Col>
              ) : (
                <Col lg="12" md="12" sm="12">
                  <p
                    style={{
                      fontWeight: "normal",
                      fontStyle: "normal",
                      fontSize: "0.8em",
                      fontFamily: "PT Sans",
                      color: "#ffffff",
                    }}
                  >
                    Instantly Swap BTC for ETH assets using decentralized
                    exchanges
                  </p>
                </Col>
              )}
            </Row>
            {window.location.pathname.split("/")[2] === "earn" ? (
              <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">
                <Col lg="4" md="12" sm="12" className="mt-2">
                  <InputGroup style={{ height: "52px" }}>
                    <Input
                      type="text"
                      value={value}
                      onChange={(event) => updateAmount(event)}
                      className="sendcoin h-100"
                      style={{
                        backgroundColor: "#354737", paddingTop:"1em",
                        borderRadius: "8px 0px 0px 8px",
                        color: "#ffffff",
                        border: "none",
                        outline: "none",
                      }}
                    />
                      <InputGroupText style={{ backgroundColor: "#485F4B", borderRadius: "0px 8px 8px 0px", 
                       color: "#ffffff", border: "none", outline: "none" }}>
                          <InlineIcon color="#ffffff" style={{ fontSize: "1.5em" }} className="mr-2" icon={btcIcon} />{' '}
                                                      BTC
                      </InputGroupText>
                    <InputGroupButtonDropdown
                      style={{
                        backgroundColor: "#354737",
                        borderRadius: "0px 8px 8px 0px",
                        color: "#ffffff",
                      }}
                      direction="right"
                      setActiveFromChild={true}
                      addonType="append"
                      isOpen={sendOpen}
                      toggle={async () => setSendOpen(!sendOpen)}
                    >
                      <DropdownToggle
                        style={{
                          backgroundColor: "#485F4B",
                          borderRadius: "0px 8px 8px 0px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                        }}
                      >
                        {_sendcoins.coin} {_sendcoins.name} <FaAngleDown />
                      </DropdownToggle>
                      <DropdownMenu
                        style={{
                          backgroundColor: "#354737",
                          borderRadius: "8px 8px 8px 8px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                          marginTop: "3.5em",
                          marginLeft: "-10em",
                        }}
                      >
                        {_coins.map((a, i) => {
                          return (
                            <DropdownItem
                              key={i}
                              className="dhover"
                              style={{
                                color: "#ffffff",
                                backgroundColor: send === a.id ? "#485F4B" : "",
                              }}
                              // onClick={() => { this._send = i; alert(this._send)}}
                              onClick={() => {
                                setSend(a.id);
                                setSendcoins({
                                  name: a.name,
                                  id: a.id,
                                  coin: a.coin,
                                });
                              }}
                            >
                              {a.coin}
                              {a.name}
                            </DropdownItem>
                          );
                        })}
                      </DropdownMenu>
                    </InputGroupButtonDropdown>
                  </InputGroup>
                </Col>
              </Row>
            ) : (
              <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">
                <Col lg="4" md="12" sm="12" className="mt-2">
                  <InputGroup style={{ height: "52px" }}>
                    <Input
                      type="text"
                      value={value}
                      onChange={(event) => updateAmount(event)}
                      className="sendcoin h-100"
                      style={{
                        backgroundColor: "#354737", paddingTop:"1em",
                        borderRadius: "8px 0px 0px 8px",
                        color: "#ffffff",
                        border: "none",
                        outline: "none",
                      }}
                    />
                      <InputGroupAddon style={{ backgroundColor: "#354737", borderRadius: "0px 8px 8px 0px", color: "#ffffff" }} addonType="append">
                         <InputGroupText style={{ backgroundColor: "#485F4B", borderRadius: "0px 8px 8px 0px", color: "#ffffff", border: "none", outline: "none" }}>
                            <InlineIcon color="#ffffff" style={{ fontSize: "1.5em" }} className="mr-2" icon={btcIcon} />{' '}
                                BTC
                          </InputGroupText>
                      </InputGroupAddon>
                    {/*<InputGroupButtonDropdown
                      style={{
                        backgroundColor: "#354737",
                        borderRadius: "0px 8px 8px 0px",
                        color: "#ffffff",
                      }}
                      direction="right"
                      setActiveFromChild={true}
                      addonType="append"
                      isOpen={sendOpen}
                      toggle={async () => {
                        setSendOpen(!sendOpen);
                      }}
                    >
                      <DropdownToggle
                        style={{
                          backgroundColor: "#485F4B",
                          borderRadius: "0px 8px 8px 0px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                        }}
                      >
                        {_sendcoins.coin} {_sendcoins.name} <FaAngleDown />
                      </DropdownToggle>
                      <DropdownMenu
                        style={{
                          backgroundColor: "#354737",
                          borderRadius: "8px 8px 8px 8px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                          marginTop: "3.5em",
                          marginLeft: "-10em",
                        }}
                      >
                        {_coins.map((a, i) => {
                          return (
                            <DropdownItem
                              key={i}
                              className="dhover"
                              style={{
                                color: "#ffffff",
                                backgroundColor: send === a.id ? "#485F4B" : "",
                              }}
                              // onClick={() => { this._send = i; alert(this._send)}}
                              onClick={() => {
                                setSend(a.id);
                                setSendcoins({
                                  name: a.name,
                                  id: a.id,
                                  coin: a.coin,
                                });
                              }}
                            >
                              {a.coin}
                              {a.name}
                            </DropdownItem>
                          );
                        })}
                      </DropdownMenu>
                    </InputGroupButtonDropdown>*/}
                  </InputGroup>
                </Col>
                <Col lg="2" md="6" sm="6" className="mt-2">
                  <img className="img-fluid" src={swapIconSvg} alt="Swap" />
                </Col>
                <Col lg="4" md="12" sm="12" className="mt-2">
                  <InputGroup style={{ height: "52px" }}>
                    <Input
                      readonly="readonly"
                      type="text"
                      value={calcValue}
                      className="getcoin h-100"
                      style={{
                        backgroundColor: "#354737", paddingTop:"1em",
                        borderRadius: "8px 0px 0px 8px",
                        color: "#ffffff",
                        border: "none",
                        outline: "none",
                      }}
                    />
                    <InputGroupAddon style={{ backgroundColor: "#354737", borderRadius: "0px 8px 8px 0px", color: "#ffffff" }} addonType="append">
                       <InputGroupText style={{ backgroundColor: "#485F4B", borderRadius: "0px 8px 8px 0px", color: "#ffffff", border: "none", outline: "none" }}>
                          <InlineIcon color="#ffffff" style={{ fontSize: "1.5em" }} className="mr-2" icon={daiIcon} />{' '}
                          DAI
                        </InputGroupText>
                    </InputGroupAddon>
                    {/*<InputGroupButtonDropdown
                      style={{
                        backgroundColor: "#354737",
                        borderRadius: "0px 8px 8px 0px",
                        color: "#ffffff",
                      }}
                      direction="right"
                      setActiveFromChild={true}
                      addonType="append"
                      isOpen={getOpen}
                      toggle={async () => setGetOpen(!getOpen)}
                    >
                      <DropdownToggle
                        style={{
                          backgroundColor: "#485F4B",
                          borderRadius: "0px 8px 8px 0px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                        }}
                      >
                        {_getcoins.coin} {_getcoins.name} <FaAngleDown />
                      </DropdownToggle>
                      <DropdownMenu
                        style={{
                          backgroundColor: "#354737",
                          borderRadius: "8px 8px 8px 8px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                          marginTop: "3.5em",
                          marginLeft: "-10em",
                        }}
                      >
                        {_coins.map((a, i) => {
                          return (
                            <DropdownItem
                              key={i}
                              className="dhover"
                              style={{
                                color: "#ffffff",
                                backgroundColor: get === a.id ? "#485F4B" : "",
                              }}
                              // onClick={() => {this._get = i; alert(this._get)}}
                              onClick={() => {
                                setGet(a.id);
                                setGetcoins({
                                  name: a.name,
                                  id: a.id,
                                  coin: a.coin,
                                });
                              }}
                            >
                              {a.coin}
                              <tab /> {a.name}
                            </DropdownItem>
                          );
                        })}
                      </DropdownMenu>
                    </InputGroupButtonDropdown>*/}
                  </InputGroup>
                </Col>
              </Row>
            )}

            <div className="justify-content-center align-content-center text-center mx-auto my-auto pt-3">
              {window.location.pathname.split("/")[2] === "earn" ? (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if (liquidityvalue === "Add Liquidity") {
                      await addLiquidity();
                    } else {
                      await removeLiquidity();
                    }
                  }}
                  className="btn text-light button-small btn-sm px-5"
                  style={{
                    fontSize: "24dp",
                    backgroundColor: "#317333",
                    borderRadius: "10px",
                  }}
                >
                  {liquidityvalue === "Add Liquidity" ? "Pool" : "Remove"}
                </button>
              ) : (
                <button
                  onClick={async (evt) => {
                    requestLoan(evt).catch((err) => console.error(err));
                  }}
                  className="btn text-light button-small btn-sm px-5"
                  style={{
                    fontSize: "24dp",
                    backgroundColor: "#317333",
                    borderRadius: "10px",
                  }}
                >
                  Swap
                </button>
              )}
            </div>
            <Row className="justify-content-center align-content-center text-center mx-auto py-3">
              <Col lg="6" md="6" sm="6">
                <span
                  onClick={async () => {
                    setShowDetail(!showdetail);
                  }}
                  className="text-light"
                  style={{
                    fontWeight: "normal",
                    cursor: "pointer",
                    fontStyle: "normal",
                    fontSize: "0.7em",
                    fontFamily: "PT Sans",
                    color: "#ffffff",
                  }}
                >
                  Details <FaAngleDown />
                </span>
              </Col>
            </Row>
            {showdetail ? (
              <Row className="justify-content-center align-content-center text-center mx-auto mt-1 mb-5">
                {window.location.pathname.split("/")[2] === "earn" ? (
                  <Col
                    lg="9"
                    md="9"
                    sm="9"
                    style={{ backgroundColor: "#354737", borderRadius: "10px" }}
                    className=" mx-4  pt-3"
                  >
                    {liquidityvalue === "Add Liquidity" ? (
                      <Row className="justify-content-center align-content-center">
                        <Col sm="7" lg="7" md="7">
                          <p
                            className="text-center text-break"
                            style={{
                              fontWeight: "normal",
                              fontStyle: "normal",
                              fontSize: "0.8em",
                              fontFamily: "PT Sans",
                              color: "#ffffff",
                            }}
                          >
                            zeroBTC has historic returns of <b>{apr}</b>
                          </p>
                        </Col>
                        <Col sm="12" lg="12" md="12">
                          <Row>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                Current Pool Size
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-end justify-content-end"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {pool} BTC
                              </p>
                            </Col>
                          </Row>
                          <Row>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                Liquidity Token Supply
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-end justify-content-end"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {totalLiquidityToken} zeroBTC
                              </p>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    ) : (
                      <Row>
                        <Col sm="12" lg="12" md="12">
                          <Row>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                className={ismobile ? "" : "text-right"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                Current Pool Size
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-end justify-content-end"
                              sm="1"
                              lg="1"
                              md="1"
                            >
                              <p
                                className={ismobile ? "" : "text-right"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {pool}
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="1"
                              lg="1"
                              md="1"
                            >
                              <p
                                className={ismobile ? "" : "text-left"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {_sendcoins.name}
                              </p>
                            </Col>
                          </Row>
                        </Col>
                        <Col sm="12" lg="12" md="12">
                          <Row>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                className={ismobile ? "" : "text-right"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                Your Share Size
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-end justify-content-end"
                              sm="1"
                              lg="1"
                              md="1"
                            >
                              <p
                                className={ismobile ? "" : "text-right"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {share}
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="1"
                              lg="1"
                              md="1"
                            >
                              <p
                                className={ismobile ? "" : "text-left"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {_sendcoins.name}
                              </p>
                            </Col>
                          </Row>
                        </Col>
                        <Col sm="12" lg="12" md="12">
                          <Row>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="6"
                              lg="6"
                              md="6"
                            >
                              <p
                                className={ismobile ? "" : "text-right"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                Original Stake
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-end justify-content-end"
                              sm="1"
                              lg="1"
                              md="1"
                            >
                              <p
                                className={ismobile ? "" : "text-right"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {stake}
                              </p>
                            </Col>
                            <Col
                              className="text-light align-content-start justify-content-start"
                              sm="1"
                              lg="1"
                              md="1"
                            >
                              <p
                                className={ismobile ? "" : "text-left"}
                                style={{
                                  fontWeight: "normal",
                                  fontStyle: "normal",
                                  fontSize: "0.8em",
                                  fontFamily: "PT Sans",
                                  color: "#ffffff",
                                }}
                              >
                                {_sendcoins.name}
                              </p>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    )}
                  </Col>
                ) : (
                  <Col
                    lg="9"
                    md="9"
                    sm="9"
                    style={{ backgroundColor: "#354737", borderRadius: "10px" }}
                    className=" mx-4  pt-3"
                  >
                    <Row className="align-content-center justify-content-center">
                      <Col
                        lg="7"
                        md="7"
                        sm="7"
                        className="justify-content-center align-content-center"
                      >
                        <p
                          className="text-center text-break"
                          style={{
                            fontWeight: "normal",
                            fontStyle: "normal",
                            fontSize: "0.8em",
                            fontFamily: "PT Sans",
                            color: "#ffffff",
                          }}
                        >
                          You are selling{" "}
                          <b>
                            {value} {_sendcoins.name}
                          </b>{" "}
                          for at least{" "}
                          <b>
                            {calcValue} {_getcoins.name}
                          </b>
                          <br />
                          Expected Price Slippage: <b>{slippage}%</b>
                          <br />
                          Additional slippage limit: <b>{slippage}%</b>
                        </p>
                      </Col>
                    </Row>
                    {/* <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                                        You are selling <b>{sendvalue} {_sendcoins.name}</b> for at least <b>{sendvalue * rate} {_getcoins.name}</b> <br />Expected Price Slippage: <b>{slippage}%</b>  <br />Additional slippage limit: <b>{slippage}%</b>  <br />fee disclosures
                                    </p> */}
                  </Col>
                )}
              </Row>
            ) : null}
            {window.location.pathname.split("/")[2] === "earn" ? null : (
              <Row className="justify-content-center align-content-center mx-auto">
                {_history.length !== 0 ? (
                  <Col lg="12" sm="12" md="12" className="min-vh-100 mt-5 pt-5">
                    <p
                      className="text-light"
                      style={{
                        fontWeight: "bolder",
                        fontSize: "2em",
                        fontFamily: "PT Sans",
                      }}
                    >
                      Your Recent Transactions
                    </p>
                    <span
                      className="text-light"
                      style={{ fontSize: "0.8em", fontFamily: "PT Sans" }}
                    >
                      <b>Connected Address:</b>{" "}
                      {userAddress &&
                        userAddress.substr(0, 6) +
                          "..." +
                          userAddress.substr(
                            userAddress.length - 5,
                            userAddress.length
                          )}
                    </span>
                    <Table responsive hover borderless className="mt-4">
                      <thead
                        style={{
                          fontSize: "0.8em",
                          fontFamily: "PT Sans",
                          color: "#ffffff",
                          backgroundColor: "#354737",
                          boxShadow: " 0px 4px 4px rgba(0, 0, 0, 0.2005)",
                        }}
                      >
                        <tr>
                          <th>Created</th>
                          <th>Escrow Address</th>
                          <th>Confirmations</th>
                          <th>Sent</th>
                          <th>Received</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {_history.map((eleos, i) => {
                          return (
                            <tr
                              key={i}
                              className="dhover justify-content-center align-content-center text-center"
                              onClick={async () => {
                                setTransactionDetails(i);
                                setTransactionModal(!transactionModal);
                              }}
                            >
                              <td className="text-light justify-content-center align-content-center text-center my-auto">
                                {eleos.created}
                              </td>
                              <td className="text-light justify-content-center align-content-center text-center my-auto">
                                {eleos.escrowAddress(
                                  (v) =>
                                    v.substr(0, 6) +
                                    "..." +
                                    v.substr(v.length - 5, v.length)
                                 )}
                              </td>
                              <td className="text-light justify-content-center align-content-center text-center my-auto">
                                <img
                                  alt={`${eleos.confirmations} of 6`}
                                  width="30%"
                                  height="30%"
                                  src={getSvgForConfirmations(
                                    eleos.confirmations
                                  )}
                                  className="img-fluid"
                                />
                              </td>
                              <td className="text-light justify-content-center align-content-center text-center my-auto">
                                {eleos.sent} {eleos.sentname}
                              </td>
                              <td className="text-light justify-content-center align-content-center text-center my-auto">
                                {eleos.received} {eleos.receivedname}
                              </td>
                              <td>
                                <p
                                  style={{
                                    color: "#000000",
                                    borderRadius: "5px",
                                    backgroundColor:
                                      eleos.status === "Liquidated"
                                        ? "#D4533B"
                                        : eleos.status === "Completed"
                                        ? "#317333"
                                        : "#DAA520",
                                  }}
                                >
                                  {eleos.status}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Col>
                ) : null}
              </Row>
            )}
          </Col>
        </Row>
        <Row className="align-content-center justify-content-center mt-5 pt-5 mb-2">
            <Col lg="10" md="10" sm="10" className="align-content-center justify-content-center mt-5 mx-auto text-center text-white-50"
                  style={{
                          fontStyle: "normal",
                          fontFamily: "PT Sans",
                        }}
              >
                Fully decentralized, maintained and operated by the 0cf community.<br /> <b>Original software build by JKR Labs LLC.</b></Col>
        </Row>
      </div>
      <TransactionDetailsModal
        ismobile={ismobile}
        setBlockTooltip={setBlockTooltip}
        blocktooltip={blocktooltip}
        transactionModal={transactionModal}
        _history={_history}
        transactionDetails={transactionDetails}
        setTransactionModal={setTransactionModal}
      />
    </>
  );
};

export default App;
