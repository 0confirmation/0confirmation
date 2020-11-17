import React, { useState, useEffect, Fragment } from "react";
import { getFees, DEFAULT_FEES } from "../lib/fees"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { BigNumber } from "@ethersproject/bignumber";
import BN from "bignumber.js";
import Jazzicon from 'jazzicon';
import fromPrivate from '@0confirmation/providers/private-key-or-seed';
import { noop } from "lodash";
import { InlineIcon } from "@iconify/react";
import swapIconSvg from "../images/swapicon.svg";
import { chainIdToName, DECIMALS } from "../lib/utils";
import ERC20 from "../lib/erc20";
import * as bitcoin from '../lib/bitcoin-helpers';

import ShifterPool from '@0confirmation/sdk/shifter-pool';
// import { getSvgForConfirmations } from "../lib/confirmation-image-wheel";
import "./App.css";
import { fromV3 } from 'ethereumjs-wallet';
import keeperWallet from '@0confirmation/sol/private/keeper';
import {
  Row,
  Col,
  InputGroup, InputGroupText, InputGroupAddon,
  Input,
  DropdownToggle,
  DropdownMenu,
  DropdownItem, ButtonDropdown,
  Tooltip
} from "reactstrap";
import LoanModal from "./LoanModal";
//import TransactionDetailsModal from "./TransactionDetailsModal";
import TransactionRow from "./TransactionsRow";
import { Link } from "react-router-dom";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import btcIcon from "@iconify/icons-cryptocurrency/btc";
import daiIcon from "@iconify/icons-cryptocurrency/dai";
import Alert from "./Alert";
import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
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
import WrongNetworkModal from "./WrongNetworkModal";
import ModalBackground from "./ModalBackground";
const CHAIN = process.env.REACT_APP_CHAIN; // eslint-disable-line
const earnWL = ['0x131aaecbff040379070024ea0ae9ab72a059e6c4', '0xdd05de1837b8f42db3f7e2f773017589845332c5']
const keeper = fromV3(keeperWallet, 'conf');
window.maxBTCSwap = 1;
window.minBTCSwap = 0.026;
const signer = provider.asEthers().getSigner();

const BLOCK_POLL_INTERVAL = 15000;

const subscribeToBlockChanges = (provider, listener, interval = BLOCK_POLL_INTERVAL) => {
  let cancelFlag = false;
  const timeout = (n) => new Promise((resolve, reject) => setTimeout(resolve, n));
  let last;
  const unsubscribe = () => (cancelFlag = true);
  (async () => {
    while (true) {
      if (cancelFlag) break;
      try {
        const blockNumber = Number(await provider.send('eth_blockNumber', []));
        if (last === undefined || blockNumber > last) {
          last = blockNumber;
          if (cancelFlag) break; // check one more time
          await listener(blockNumber);
        }
        await timeout(interval);
      } catch (e) {
        if (process.env.REACT_APP_CHAIN === 'test') console.error(e);
        await timeout(interval);
      }
    }
  })().catch(() => {});
  return unsubscribe;
};

if (window.ethereum) window.ethereum.autoRefreshOnNetworkChange = false;

let cachedBtcBlock = 0;

const fetchIsRenVMSignatureReady = async (zero, depositedLiquidityRequestParcel) => {
  const out = await zero.driver.sendWrapped('ren_queryTx', { txHash: depositedLiquidityRequestParcel.computeShiftInTxHash() });
  return Boolean(out && out.tx && out.tx.out);
};


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
export const getRenBTCToken = async () =>
  new Token(
    ChainId.MAINNET,
    await getRenBTCAddress(),
    DECIMALS.btc,
    "RenBTC",
    "RenBTC"
  );
export const getWETHToken = () =>
  new Token(ChainId.MAINNET, contracts.weth, DECIMALS.weth, "WETH", "WETH");

const getDAIBTCMarket = async (provider) => {
  const renbtc = await getRenBTCToken();
  const route = new UniRoute(
    [
      await Pair.fetchData(renbtc, getWETHToken(), provider),
      await Pair.fetchData(getDAIToken(), getWETHToken(), provider),
    ],
    renbtc
  );
  return route;
};

const getTradeExecution = async (provider, route, amount) => {
  return new Trade(
    route || (await getDAIBTCMarket(provider)),
    new TokenAmount(await getRenBTCToken(), amount),
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
  CHAIN === "1" ? "mainnet" : CHAIN === "42" ? "testnet" : "buidler"
);
const mpkh = contracts.mpkh;

const USE_TESTNET_BTC =
  process.env.USE_TESTNET_BTC || process.env.REACT_APP_USE_TESTNET_BTC; // eslint-disable-line

const makeZero = (provider) => {
  const zero = ["test", "external"].includes(CHAIN)
    ? new Zero.ZeroMock(provider)
    : new Zero(
      provider,
      CHAIN === "42" ? "testnet" : CHAIN === "1" ? "mainnet" : "buidler"
    );
  if (USE_TESTNET_BTC)
    zero.driver.registerBackend(
      new BTCBackend({
        network: "testnet",
      })
    );
  return zero;
};

const getMockRenBTCAddress = async (provider) => {
  const registry = new ethers.Contract(
    contracts.shifterRegistry,
    ShifterRegistryMock.abi,
    signer
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
document.body.className += ' App';

const contractsDeferred = utils.defer();
const pvt = randomBytes(32).toString("hex");
const makeTestWallet = (proxyTarget) =>
  provider.makeFauxMetamaskSigner(
    makePersonalSignProviderFromPrivate(pvt, provider.dataProvider),
    proxyTarget
  );


const keeperEmitter = utils.defer();
const btcBlockEmitter = utils.defer();

const TradeRoom = (props) => {
  const [value, setValue] = useState("0");
  const { ismobile } = props;
  //const [userAddress, setUserAddress] = useState(ethers.constants.AddressZero);
  const [userAddress, setUserAddress] = useState(ethers.constants.AddressZero);
  const setup = async () => {
    if(userAddress == null) {
      setUserAddress(ethers.constants.AddressZero)
    }
    provider.setSigningProvider(makeTestWallet(window.ethereum || provider));
    contracts = getAddresses('buidler');
    zero.setEnvironment(contracts);
    await getRenBTCAddress(
      new ethers.providers.Web3Provider(provider), {
      shifterRegistry: contracts.shifterRegistry
    });
    zero.setEnvironment(contracts);
    await setupTestUniswapSDK(zero.getProvider(), () => contracts);
    if (!["embedded", "test"].includes(CHAIN)) return;
    const buidlerAddress = (
      await provider.dataProvider.asEthers().send("eth_accounts", [])
    )[0];
    const keeperPvt = ethers.utils
      .solidityKeccak256(["address"], [buidlerAddress])
      .substr(2);
    const keeperProvider = personalSignProviderFromPrivate(
      keeper.getPrivateKeyString().substr(2),
      provider.dataProvider
    );
    const keeperEthers = keeperProvider.asEthers();
    const [keeperAddress] = await keeperEthers.send("eth_accounts", []);
    let emitter = zero.createKeeperEmitter();
    let btcBlockEmitterInstance = zero.createBTCBlockEmitter();
    keeperEmitter.resolve(emitter);
    btcBlockEmitter.resolve(btcBlockEmitterInstance);
    emitter.on('keeper', (address) => {
        console.log('keeper', address);
      setKeepers({
        [ address ]: true,
        ...keepers
      });
    });
    btcBlockEmitterInstance.on('block', (number) => {
      bitcoin.setLatestBlock(number);
      console.log('btc block', number);
    });
    emitter.emit('keeper', keeperAddress);
    setInterval(() => {
        console.log('keeper', keeperAddress);
      emitter.emit('keeper', keeperAddress);
    }, 30e3);
    const shifterPool = new ShifterPool(zero.shifterPool.address, new JsonRpcProvider(process.env.REACT_APP_GANACHE_URI || 'http://localhost:8545').getSigner());
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
        .getSigner()
        .sendTransaction(
          {
            value: ethers.utils.hexlify(ethers.utils.parseEther("10")),
            gasLimit: ethers.utils.hexlify(21000),
            gasPrice: "0x01",
            to: keeperAddress
          })

      await sendEtherTx.wait();
      console.log("done!");
    }
    console.log('sending eth to user');
    const sendUserEtherTx = await provider.dataProvider
      .asEthers()
      .getSigner()
      .sendTransaction(
        {
          value: ethers.utils.hexlify(ethers.utils.parseEther("1")),
          gasLimit: ethers.utils.hexlify(21000),
          gasPrice: "0x01",
          to: (await zero.getProvider().asEthers().listAccounts())[0]
        })
    await sendUserEtherTx.wait();
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
    const keeperZero = makeZero(keeperProvider.asEthers().getSigner());
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
      await new Promise((resolve) => setTimeout(resolve, 40000));
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
      const deposited = await v.waitForDeposit(0, 60 * 30 * 1000);
      console.logKeeper("found deposit -- initializing a borrow proxy!");
      const bond = BigNumber.from(v.amount).div(9);
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
  const [ fees, setFees ] = useState(DEFAULT_FEES);
  const getAndSetFees = async (inValue) => {
    (async () => {
        const fees = await getFees(parseFloat(inValue) > 0 ? inValue : value, await getRenBTCToken(), await getWETHToken(), zero.getProvider().asEthers());
        setFees(fees);
    })().catch((err) => console.error(err));
  };
  useEffect(() => {
    if (!window.ethereum) return;
    const ethersProvider = zero.getProvider().asEthers();
    const listener = async (accounts) => {
      const walletAccounts = await ethersProvider.listAccounts();
      if (accounts[0] !== walletAccounts[0]) {
        setShowAlert(true);
        accounts[0] != null ? setMessage("MetaMask using new wallet: " + accounts[0]) : setMessage("MetaMask has been disconnected.");
        setUserAddress(accounts[0]);
      }
    };
    window.ethereum.on("accountsChanged", listener);
    const networkListener = async () => {
      let currentProvider = await new ethers.providers.Web3Provider(window.ethereum)
      let network = await currentProvider.getNetwork()
      let networkId = Number(network.chainId)
      setCurrentNetwork(networkId)
      const walletAccounts = await currentProvider.listAccounts();
      const zeroAccounts = await ethersProvider.listAccounts();
      if (
        walletAccounts[0] === zeroAccounts[0] &&
        networkId !== Number(CHAIN) &&
        CHAIN !== 'test'
      ) {
        setWrongNetworkModal(true)
        setShowAlert(true);
        setMessage(
          "MetaMask using network " +
          chainIdToName(String(networkId)) +
          " instead of " +
          chainIdToName(String(CHAIN))
        );
        setUserAddress(ethers.constants.AddressZero)
      } else {
        setWrongNetworkModal(false)
      }
    };
    window.ethereum.on("chainChanged", networkListener);
    return () => {
      window.ethereum.removeListener("accountsChanged", listener);
      window.ethereum.removeListener("chainChanged", networkListener);
    };
  }, []);
  const [ keepers, setKeepers ] = useState({});

  useEffect(() => {
    (async () => {
      if (CHAIN === "test" || CHAIN === "embedded") await setup();
      else {
        if (window.ethereum) provider.setSigningProvider(window.ethereum);
        //        if (web3Modal.cachedProvider) await _connectWeb3Modal();
        if (CHAIN === "42" || CHAIN === 'test')
          await setupTestUniswapSDK(zero.getProvider(), () => contracts);
        await zero.initializeDriver();
        let emitter = zero.createKeeperEmitter();
        keeperEmitter.resolve(emitter);
        setInterval(() => {
          setKeepers({});
          emitter.poll();
        }, 120e3);
        emitter.on('keeper', (address) => {
          console.log('keeper', address);
          setKeepers({
            [ address ]: true,
            ...keepers
          });
        });
        let btcBlockEmitter = zero.createBTCBlockEmitter();
        btcBlockEmitter.on('block', (number) => {
          bitcoin.setLatestBlock(number);
          console.log('btc block', number);
        })
        await emitter.subscribe();
        await btcBlockEmitter.subscribe();
        contractsDeferred.resolve(contracts);
        console.log("libp2p: bootstrapped");
      }
      const ethersProvider = zero.getProvider().asEthers();
      let busy = false;
      const walletAccounts = await ethersProvider.listAccounts();
      const zeroAccounts = await ethersProvider.listAccounts();
      let currentProvider = window.ethereum && new ethers.providers.Web3Provider(window.ethereum) || ethersProvider;
      let network = await currentProvider.getNetwork()
      let networkId = Number(network.chainId)
      setCurrentNetwork(networkId)
      if (
        walletAccounts[0] === zeroAccounts[0] &&
        networkId !== Number(CHAIN) &&
        CHAIN !== 'test'
      ) {
        setWrongNetworkModal(true)
        setShowAlert(true);
        setMessage(
          "MetaMask using network " +
          chainIdToName(String(networkId)) +
          " instead of " +
          chainIdToName(String(CHAIN))
        );
      } else {
        setWrongNetworkModal(false)
      }
      const listener = async (number) => {
        if (number % 3 && !busy) {
          busy = true;
          try {
            await getPendingTransfers(cachedBtcBlock);
            if (fees.mintFee.percentage <= 0) {
              await getAndSetFees(value);
            }
          } catch (e) {
            console.error(e);
          }
          busy = false;
        }
      };
      //ethersProvider.on("block", listener); // too much polling
      const unsubscribe = subscribeToBlockChanges(ethersProvider, listener, BLOCK_POLL_INTERVAL); // just pass in the interval explicitly to be clear
      const userAddresses = await ethersProvider.listAccounts();
      if (userAddresses) setUserAddress(userAddresses[0]);
      return unsubscribe;
    })().catch((err) => console.error(err));
  }, []);
  const [btcBlock, setBTCBlock] = useState(0);
  const [changeWalletTooltip, setChangeWalletTooltip] = useState(false);
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
        await getRenBTCAddress(),
        ERC20ABI,
        signer
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
      const renbtcBalanceFetched = utils.truncateDecimals(ethers.utils.formatUnits(await renbtcWrapped.balanceOf(userAddress || ethers.constants.AddressZero), DECIMALS.btc, DECIMALS.btc), 4);
      setRenbtcBalance(renbtcBalanceFetched);
      const totalSupply = await liquidityToken.totalSupply();
      const apr = utils.truncateDecimals(
        new BN(String(poolSize.add(offset)))
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
    if (userAddress != null) {
      let oldJazzicon = document.getElementById('jazzicon')
      if (oldJazzicon) oldJazzicon.remove();
      let jazzicon = Jazzicon(16, parseInt(userAddress.slice(2, 10), 16))
      jazzicon.className = 'jazzicon'
      jazzicon.setAttribute('id', 'jazzicon')
      let currentAccountDiv = document.getElementById('connectedAddress')
      if (currentAccountDiv){
        currentAccountDiv.prepend(jazzicon)
      }
    }
    return subscribeToBlockChanges(ethersProvider, listener, BLOCK_POLL_INTERVAL);
  }, [userAddress]);
  const getPendingTransfers = async (btcBlock) => {
    const ethersProvider = zero.getProvider().asEthers();
    if (!(await ethersProvider.listAccounts())[0]) return;
    const borrows = await getBorrows(zero);
    const [address] = await ethersProvider.listAccounts();
    const uninitialized = (persistence.loadLoans(zero)).filter(Boolean).filter((v) => v.borrower.toLowerCase() === address.toLowerCase()).filter((v) => v.state === 'deposited' || v.state === 'forced').filter((v) => {
      const found = v.state !== 'forced' && borrows.find((u) => v.nonce === u.nonce);
      if (found) {
        persistence.removeLoan(v.localIndex);
        return false;
      }
      return true;
    });
    for (const parcel of uninitialized) {
      if (!parcel.isReady) {
        parcel.isReady = await fetchIsRenVMSignatureReady(zero, parcel);
        persistence.saveLoan(parcel);
      }
    }
    const history = uninitialized.concat(borrows.filter(
      (v) => v.pendingTransfers.length === 1 && v.pendingTransfers[0].sendEvent
    ));
    const result = [];
    for (const item of history) {
      result.push(await record.getRecord(item, zero, btcBlock));
    }
    setHistory(record.decorateHistory(result.reverse()));
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
  const [renbtcBalance, setRenbtcBalance] = useState('0');
  const [stake, setStake] = useState("0");
  const [sendOpen, setSendOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [warningAlert, setWarningAlert] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState("none");
  const [transactionModal, setTransactionModal] = useState(false);
  const [_history, setHistory] = useState(record.decorateHistory([]));
  const [getOpen, setGetOpen] = useState(false);
  const [networkModal, setWrongNetworkModal] = useState(false)
  const [currentNetwork, setCurrentNetwork] = useState("")
  const [correctNetwork, setCorrectNetwork] = useState(Number(CHAIN))
  const [validAmount, setValidAmount] = useState(true)
  const [errorAmount, setErrorAmount] = useState(0)
  const [keeperErrorAmount, setKeeperErrorAmount] = useState(0)

  //  const [gets, setGets] = useState(0);
  const [rate, setRate] = useState("0");
  if (rate || setRate) noop(); // eslint silencer
  //  const [getvalue, setGetvalue] = useState(0);
  const [slippage, setSlippage] = useState("0");
  //  const [returnPercentage, setReturnPercentage] = useState(0.232);
  const [modal, setModal] = useState(false);
  const [message, setMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
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
  const [send, setSend] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const initializeMarket = async () => {
    await updateMarket();
    setRate("N/A");
  };

  const showWarningAlert = function (message) {
    setWarningAlert(true);
    setWarningMessage(message);
    setTimeout(() => {
      setWarningAlert(false)
    }, 5500)
  }
  const checkAmount = async () => {
    if(errorAmount > window.maxBTCSwap && window.location.pathname.split("/")[2] === "swap") {
      showWarningAlert("The maximum swap amount is " + window.maxBTCSwap + " BTC.");
    }else if (errorAmount != 0 && errorAmount < window.minBTCSwap && window.location.pathname.split("/")[2] === "swap") {
      showWarningAlert("The minimum swap amount is " + window.minBTCSwap + " BTC.");
    }else if (keeperErrorAmount > 0) {
      showWarningAlert("You are trying to swap " + keeperErrorAmount + " BTC but there is only " + pool + " BTC in the pool")
    } 
    return
  }
  useEffect(() => {
    getAndSetFees(0)
  },[]) // run on page load
  const updateAmount = async (e, oldValue) => {
    e.preventDefault();
    var checkValueLimit;
    if (!isNaN(e.target.value)) getAndSetFees(e.target.value).catch((err) => console.error(err));
    if (parseFloat(e.target.value) > window.maxBTCSwap && window.location.pathname.split("/")[2] === "swap") {
      //checkValueLimit = oldValue;
      setValidAmount(false);
      setErrorAmount(e.target.value);
      setCalcValue("0");
      setRate("0");
      setSlippage("0");
      // showWarningAlert("The maximum swap amount is " + window.maxBTCSwap + " BTC.");
    } else if (parseFloat(e.target.value) < window.minBTCSwap && window.location.pathname.split("/")[2] === "swap") {
      // showWarningAlert("The minimum swap amount is " + window.minBTCSwap + " BTC.");
      //checkValueLimit = oldValue;
      setValidAmount(false);
      setErrorAmount(e.target.value);
      setCalcValue("0");
      setRate("0");
      setSlippage("0");
    } else if (parseFloat(e.target.value) > Number(pool)) {
      setValidAmount(false);
      setKeeperErrorAmount(e.target.value);
      setCalcValue("0");
      setRate("0");
      setSlippage("0");
    } else if (parseFloat(e.target.value) >= window.minBTCSwap || Number(e.target.value) === 0 || e.target.value === ".") {
      checkValueLimit = e.target.value;
      setValidAmount(true);
      setErrorAmount(0);
    } 
    else {
      setValidAmount(false);
      setErrorAmount(0);
      setCalcValue("0");
      setRate("0");
      setSlippage("0");
    }
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
    const price = new BN(trade.executionPrice.toFixed(8));
    const calcValue = (utils.truncateDecimals(new BN(trade.outputAmount.toExact()).minus(new BN(fees.totalFees.prettyAmount).multipliedBy(price)), 2));
    setCalcValue(calcValue);
    setRate(trade.executionPrice.toFixed(2));
    setSlippage(trade.slippage.toFixed(2));
  };
  const addLiquidity = async () => {
    const liquidityToken = await zero.getLiquidityTokenFor(contracts.renbtc);
    const ethersProvider = zero.getProvider().asEthers();
    const [user] = await ethersProvider.listAccounts();
    const ethersSigner = zero.getSigner();
    const renbtcWrapped = new ERC20(contracts.renbtc, ethersSigner);
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
      amount: ethers.utils.parseUnits(String(value), 8).toString(),
      nonce: "0x" + randomBytes(32).toString("hex"),
      gasRequested: ethers.utils.parseEther("0").toString(),
      actions: swap.createSwapActions({
        borrower: 
          await zero.getAddress(),
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
      const deposited = await parcel.waitForDeposit(0, 30 * 60 * 1000);
      persistence.saveLoan(deposited);
      setWaiting(false);
      await getPendingTransfers();

      const length = _history.length;
      if (CHAIN === 'test') await new Promise((resolve) => setTimeout(resolve, 70000));
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
        //setTransactionModal(true);
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
    if (networkModal && currentNetwork === correctNetwork) setWrongNetworkModal(false);
  };
    useEffect(() => {
        if (CHAIN === 'test') console.log('keepers', (JSON.stringify(keepers)));
    }, [ keepers ])
  return (
    <>
      <ModalBackground isOpen={networkModal || modal} />
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
      <WrongNetworkModal
        modal={networkModal}
        closeModal={closeModal}
        currentNetwork={currentNetwork}
        correctNetwork={correctNetwork}
      />
      <div
        className={(ismobile ? "justify-content-center align-content-center pt-1" : "justify-content-center align-content-center pt-1 swap")}
        style={{
          zIndex: "1",
          overflowX: "hidden",
          position: "relative",
          opacity: modal || transactionModal ? "0.1" : "1",
        }}
      >
        <div className={window.innerWidth < 600 ? "d-flex pt-3 connect-wallet-btn" : "d-flex pt-3 connect-wallet-btn"}>
          {(userAddress != null && userAddress !== ethers.constants.AddressZero ?
            <Fragment>
              <span
                className="text-light"
                id="connectedAddress"
                onClick={(evt) => connectWeb3Modal(evt)}
                style={{ cursor: "pointer", fontSize: "0.8em", fontFamily: "PT Sans", color: "#00FF41" }}
              >
                {" "}
                {userAddress &&
                  userAddress.substr(0, 6) +
                  "..." +
                  userAddress.substr(
                    userAddress.length - 5,
                    userAddress.length
                  )}
              </span>
              <Tooltip placement="top" isOpen={changeWalletTooltip} target="connectedAddress" toggle={() => setChangeWalletTooltip(!changeWalletTooltip)}>Click to Change Wallet</Tooltip>
            </Fragment> :
            <button
              className="btn text-light"
              style={{
                fontSize: "24dp",
                backgroundColor: "#008F11",
                width: "248dp",
                borderRadius: "10px",
              }}
              onClick={(evt) => connectWeb3Modal(evt)}
            >
              Connect Wallet
                </button>
          )
          }
        </div>

        <div className="alert-box">
          {showAlert ? (
            <Alert
              delay={5000}
              boldText="Notice: "
              detailText={message}
              alertType="alert-green"
            />
          ) : null}
        </div>
        <div className="alert-box">
          {warningAlert ? (
            <Alert
              delay={5000}
              boldText="WARNING: "
              detailText={warningMessage}
              alertType="alert-red"
            />
          ) : null}
        </div>
        <Row className="justify-content-center align-content-center text-center mx-auto mt-5">
          <Col
            lg="3"
            md="6"
            sm="6"
            className="justify-content-center align-content-center mx-auto w-50 h-50"
            style={{ backgroundColor: "#003B00", borderRadius: "10px" }}
          >
            <Row className="justify-content-center align-content-center p-1 text-light">
              <Col
                className="justify-content-center align-content-center py-1"
                lg="6"
                md="6"
                sm="6"
              >
                <Link
                  to="swap"
                  style={{
                    outline: "none",
                    textDecoration: "none",
                    color: "#ffffff",
                    width: "100%"
                  }}
                  href="/#"
                  onClick={() => { setValue("0"); setCalcValue("0"); setSlippage("0"); }}
                >
                  <div className="btn text-light"
                    style={{
                      width: "100%",
                      borderRadius: ismobile ? "10px" : "13px",
                      backgroundColor:
                        window.location.pathname.split("/")[2] === "swap"
                          ? "#008F11"
                          : "",
                    }}>

                    Swap
                </div>
                </Link>
              </Col>
              <Col
                className="justify-content-center align-content-center py-1"
                lg="6"
                md="6"
                sm="6"
              >
                <Link
                  to="earn"
                  style={{
                    outline: "none",
                    textDecoration: "none",
                    color: "#ffffff",
                  }}
                  href="/#"
                  onClick={() => { setValue("0"); setCalcValue("0"); setSlippage("0"); }}
                >
                  <div className="btn text-light"
                    style={{
                      width: "100%",
                      borderRadius: ismobile ? "10px" : "13px",
                      backgroundColor:
                        window.location.pathname.split("/")[2] === "earn"
                          ? "#008F11"
                          : "",
                    }}>
                    Earn
                </div>
                </Link>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="justify-content-center align-content-center text-center mx-auto mt-2"></Row>
        <Row className="justify-content-center align-content-center text-center">
          <Col
            lg="8"
            md="8"
            sm="8"
            style={{
              //               backgroundColor: "#1F2820",
              borderRadius: "10px 10px 0px 0px",
              minHeight: "70vh",
            }}
            className=" mx-4"
          >
            <Row className="justify-content-center align-content-center text-center mx-auto">
              {window.location.pathname.split("/")[2] === "earn" ? (
                <Col lg="6" md="6" sm="6">
                  <Row>
                    {/* <Col lg="12" md="12" sm="12">
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
                    </Col> */}
                    <Col lg="12" md="12" sm="12">
                      <ButtonDropdown
                        className="mb-3"
                        isOpen={liquidity}
                        toggle={() => setLiquidity(!liquidity)}
                      >
                        <DropdownToggle
                          style={{
                            width: "11em", padding: "0.200em", border: "2px solid #008F11",
                            backgroundColor: "#0D0208", borderRadius: "8px 8px 8px 8px",
                            color: "#ffffff", outline: "none"
                          }}
                        >
                          <span>
                            <span className="mr-1">{liquidityvalue}</span>{" "}
                            <FaAngleDown color="#008F11" />
                          </span>
                        </DropdownToggle>
                        <DropdownMenu
                          className="dhover text-light"
                          style={{
                            backgroundColor: "#0D0208", borderRadius: "0px 0px 8px 8px",
                            color: "#ffffff", border: "none", outline: "none",
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
                                    liquidityvalue === a ? "#008F11" : "",
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
              ) : null
                // (
                //     <Col lg="6" md="6" sm="6">
                //       <p
                //         style={{
                //           fontWeight: "bold",
                //           fontStyle: "normal",
                //           fontSize: "2em",
                //           fontFamily: "PT Sans",
                //           color: "#ffffff",
                //         }}
                //       >
                //         0cf Swap
                //     </p>
                //     </Col>
                //   )
              }
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
                      color: "#00FF41",
                    }}
                  >
                    {(liquidityvalue === "Add Liquidity") ?
                      "Add renBTC to the 0cf liquidity pool" : "Withdrawal renBTC from the 0cf liquidity pool"}
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
                        color: "#00FF41"
                      }}
                    >
                      Instantly Swap BTC for ETH assets using decentralized
                      exchanges
                  </p>
                  </Col>
                )}
            </Row>
            <Row className="justify-content-center align-content-center text-center mt-0">
              <Col lg="5" md="5" sm="5" className="py-2" style={{
                border: "1px solid #008F11", userSelect: "none", cursor: "default", borderRadius: "6px", fontWeight: "normal",
                fontStyle: "normal",
                fontSize: "0.8em",
                fontFamily: "PT Sans",
                color: "#fff"
              }}>
                <span>0confirmation is beta software and <span style={{ color: "#F80C0C" }}>HAS NOT BEEN AUDITED.</span></span><br />
                <span>Do not use any more than you can afford to lose.<br />
            Read more about the risks <a href="https://docs.0confirmation.com/security-considerations" target="_blank" style={{ color: "#008F11", textDecoration: "none" }}>here</a></span>
              </Col>
            </Row>
            {window.location.pathname.split("/")[2] === "earn" ? (
              <Row className="justify-content-center align-content-center text-center mx-auto my-3 text-light">
                <Col lg="4" md="12" sm="12" className="mt-2">
                  <InputGroup style={{ height: "52px", border: "2px solid #008F11", borderRadius: "8px" }}>
                    <Input
                      type="text"
                      value={value}
                      onChange={(event) => updateAmount(event, value)}
                      onBlur={() => checkAmount()}
                      className={liquidityvalue === "Add Liquidity" ? "sendcoin h-100" : "getcoin h-100"}
                      style={{
                        backgroundColor: "#0D0208", paddingTop: "1em",
                        borderRadius: "8px 0px 0px 8px", color: "#ffffff", border: "none", outline: "none"
                      }}
                    />
                    {/* <InputGroupText style={{ backgroundColor: "#008F11", borderRadius: "0px 8px 8px 0px", 
                       color: "#ffffff", border: "none", outline: "none" }}>
                          <InlineIcon color="#ffffff" style={{ fontSize: "1.5em" }} className="mr-2" icon={btcIcon} />{' '}
                                                      BTC
                      </InputGroupText> */}
                    {/* <InputGroupButtonDropdown
                      style={{
                        backgroundColor: "#008F11",
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
                          backgroundColor: "#008F11",
                          borderRadius: "0px 8px 8px 0px",
                          color: "#ffffff",
                          border: "none",
                          outline: "none",
                        }}
                      >
                        {_coins[send].coin} {_coins[send].name} <FaAngleDown />
                      </DropdownToggle>
                      <DropdownMenu
                        style={{
                          backgroundColor: "#008F11",
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
                                backgroundColor: send === a.id ? "#008F11" : "",
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
                    </InputGroupButtonDropdown> */}
                    <InputGroupAddon style={{ userSelect: "none", cursor: "default", backgroundColor: "#003B00", borderRadius: "0px 8px 8px 0px", color: "#ffffff" }} addonType="append">
                      <InputGroupText style={validAmount ? {
                        backgroundColor: "#003B00", borderRadius: "0px 8px 8px 0px", color: "#ffffff", border: "none", outline: "none"
                      } :
                        {
                          backgroundColor: "#800000", borderRadius: "0px 5px 5px 0px",
                          color: "#ffffff", border: "1px #800000", outline: "none",
                        }}>
                        <InlineIcon color="#ffffff" style={{ fontSize: "1.5em" }} className="mr-2" icon={btcIcon} />{' '}
                                renBTC
                          </InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  <span style={{ fontFamily: "PT Sans", fontSize: "0.8em" }}
                    className={(ismobile) ? "ml-auto" : ""}>
                    <span className={(ismobile) ? "ml-auto" : ""} style={{ color: "#00FF41" }}>Current Balance: </span>{renbtcBalance} {_sendcoins.name}</span>
                </Col>
              </Row>
            ) : (
                <Row className="justify-content-center align-content-center text-center mx-auto my-3">
                  <Col lg="12" md="12" sm="12">
                    <Row className="justify-content-center align-content-center text-center mx-auto text-light">
                      <Col lg="5" md="12" sm="12" className="mt-2">
                        <InputGroup style={validAmount ? { height: "52px", border: "2px solid #008F11", borderRadius: "6px" }
                          : { height: "52px", border: "2px solid #8B0000", boxShadow: "0 0 8px #8B0000", borderRadius: "6px" }}>
                          <Input
                            type="text"
                            value={value}
                            placeholder="0"
                            onChange={(event) => updateAmount(event, value)}
                            onBlur={() => checkAmount()}
                            className="sendcoin h-100"
                            style={{
                              backgroundColor: "transparent", paddingTop: "1em", color: "#ffffff", border: "none", outline: "none",
                              borderRadius: "0px 0px 0px 0px",
                            }}
                          />
                          <InputGroupAddon  style={{ userSelect: "none", cursor: "default", backgroundColor: "#003B00", borderRadius: "0px 6px 6px 0px", color: "#ffffff" }} addonType="append">
                            <InputGroupText style={validAmount ? {
                              backgroundColor: "#003B00", borderRadius: "0px 6px 6px 0px", color: "#ffffff", border: "none", outline: "none"
                            } :
                              {
                                backgroundColor: "#800000", borderRadius: "0px 0px 0px 0px",
                                color: "#ffffff", border: "1px #800000", outline: "none",
                              }}>
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
                    </Row>

                  </Col>
                  <Col lg="12" md="12" sm="12">
                    <Row className="justify-content-center align-content-center text-center mx-auto">
                        <Col className="py-2" lg="4" md="4" sm="4" style={{backgroundColor:"#003B00", fontSize:"0.75rem", minHeight:"12rem", maxWidth:"22rem", userSelect:"none", userSelect:"-moz-none"}}>
                          <Row className="mx-2 mt-3 mb-1">
                            <Col className="text-left" style={{color:"#00FF41"}}>0cf Loan Fee ({ fees.loanFee.percentage })</Col>
                            <Col className="text-right text-light">{ fees.loanFee.prettyAmount } BTC</Col>
                          </Row>
                          <Row className="mx-2 mt-3 mb-1">
                            <Col className="text-left" style={{color:"#00FF41"}}>renVM Fee ({ fees.mintFee.percentage })</Col>
                            <Col className="text-right text-light">{ fees.mintFee.prettyAmount } BTC</Col>
                          </Row>
                          <Row className="mx-2 mt-3 mb-1">
                            <Col className="text-left" style={{color:"#00FF41"}}>BTC Network Fee</Col>
                            <Col className="text-right text-light">{ fees.baseFee.prettyAmount } BTC</Col>
                          </Row>
                          <Row className="mx-2 mt-3 mb-1">
                            <Col className="text-left" style={{color:"#00FF41"}}>Est. Slippage</Col>
                            <Col className="text-right text-light"><b>{slippage}%</b></Col>
                          </Row>
                          <Row className="mx-2 mt-3 mb-3">
                            <Col className="text-left" style={{color:"#00FF41"}}>Estimated Gas Cost<br/><span style={{color:"#87888C"}}>@ { fees.fastGasPrice } Gwei</span></Col>
                            <Col className="text-right text-light">{ fees.totalGasCostEth } ETH / { fees.btcGasFee.prettyAmount } BTC</Col>
                          </Row>

                          {/* <Row className="mx-2 mt-3 mb-1">
                            <Col className="text-center" ><Link to="#" style={{color:"#00FF41",textDecoration:"none", borderBottom:"1px solid #00FF41"}}>view fee details</Link></Col>
                          </Row> */}
                        </Col>
                    </Row>
                  </Col>

                  {/* <Col lg="2" md="6" sm="6" className="mt-2">
                    <img className="img-fluid" src={swapIconSvg} alt="Swap" />
                  </Col> */}
                  <Col lg="12" md="12" sm="12">
                    <Row className="justify-content-center align-content-center text-center mx-auto text-light">
                      <Col lg="5" md="12" sm="12">
                        <InputGroup style={{ userSelect: "none", cursor: "default", height: "52px", border: "2px solid #008F11", borderRadius: "6px", }}>
                          <Input
                            readOnly={true}
                            type="text"
                            value={calcValue}
                            className="getcoin h-100"
                            style={{
                              backgroundColor: "transparent", userSelect: "none", cursor: "default", paddingTop: "1em", color: "#ffffff", border: "none", outline: "none",
                              borderRadius: "0px 0px 0px 0px",
                            }}
                          />
                          <InputGroupAddon style={{ backgroundColor: "#003B00", borderRadius: "0px 6px 6px 0px", color: "#ffffff" }} addonType="append">
                            <InputGroupText style={{ backgroundColor: "#003B00", borderRadius: "0px 6px 6px 0px", color: "#ffffff", border: "none", outline: "none" }}>
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
                  </Col>
                </Row>
              )}

            <div className="justify-content-center align-content-center text-center mx-auto my-auto pt-3">
              {window.location.pathname.split("/")[2] === "earn" ? (
                (
                  userAddress != null && earnWL.includes(userAddress.toLowerCase()) && userAddress !== ethers.constants.AddressZero ?
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
                        backgroundColor: "#008F11",
                        borderRadius: "10px",
                        marginBottom: "2rem"
                      }}
                    >
                      {liquidityvalue === "Add Liquidity" ? "Add" : "Remove"}
                    </button> : userAddress != null ? <button
                      className="btn button-small btn-sm px-5"
                      onClick={!earnWL.includes(userAddress.toLowerCase()) ? null : (evt) => connectWeb3Modal(evt)}
                      style={{
                        fontSize: "24dp",
                        backgroundColor: "#008F11",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        marginBottom: "2rem",
                        opacity: "0.38"
                      }}
                    >
                      {!earnWL.includes(userAddress.toLowerCase()) ? "Earn Not Enabled" : "Connect Wallet to Provide Liquidity"}
                    </button> : <button
                      className="btn button-small btn-sm px-5"
                      onClick={(evt) => connectWeb3Modal(evt)}
                      style={{
                        fontSize: "24dp",
                        backgroundColor: "#008F11",
                        color: "#FFFFFF",
                        borderRadius: "10px",
                        marginBottom: "2rem",
                        opacity: "0.38"
                      }}
                    >
                      Connect Wallet to Provide Liquidity
                    </button>)
              ) : (
                userAddress != null && userAddress !== ethers.constants.AddressZero && validAmount && Object.keys(keepers).length !== 0 ?
                  <button
                    onClick={async (evt) => {
                      requestLoan(evt).catch((err) => console.error(err));
                    }}
                    className="btn text-light button-small btn-sm px-5"
                    style={{
                      fontSize: "24dp",
                      backgroundColor: "#008F11",
                      borderRadius: "10px",
                    }}
                  >
                    Swap
              </button> :
                  <button
                    className="btn button-small btn-sm px-5"
                    onClick={userAddress == null || userAddress === ethers.constants.AddressZero ? (evt) => connectWeb3Modal(evt) : null}
                    style={{
                      fontSize: "24dp",
                      backgroundColor: "#008F11",
                      borderRadius: "10px",
                      color: "#FFFFFF",
                      opacity: "0.38"
                    }}
                  >
                    {userAddress == null || userAddress === ethers.constants.AddressZero ? "Connect Wallet to Swap" : validAmount ? "There are no keepers available" : "Enter Valid Amount"}
                  </button>
              )}
            </div>
            {/*<Row className="justify-content-center align-content-center text-center mx-auto py-3">
              <Col lg="6" md="6" sm="6">
                <span
                  onClick={async () => {
                    setShowDetail(!showdetail);
                  }}
                  style={{
                    fontWeight: "normal",
                    cursor: "pointer",
                    fontStyle: "normal",
                    fontSize: "0.7em",
                    fontFamily: "PT Sans",
                    color: "#00FF41",
                  }}
                >
                  Details {showdetail ? <FaAngleDown /> : <FaAngleUp />}
                </span>
              </Col>
            </Row>*/}
            {showdetail ? (
              <Row className="justify-content-center align-content-center text-center mx-auto mt-1 mb-5">
                {window.location.pathname.split("/")[2] === "earn" ? (
                  <Col
                    lg="9"
                    md="9"
                    sm="9"
                    style={{ backgroundColor: "#0D0208", border: "1px solid #008F11", borderRadius: "10px" }}
                    className=" mx-4  pt-3"
                  >
                    {liquidityvalue === "Add Liquidity" ? (
                      <Row className="justify-content-center align-content-center">
                        {/*<Col sm="7" lg="7" md="7">
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
                        </Col>*/}
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
                ) : null
                // (
                    // <Col
                    //   lg="9"
                    //   md="9"
                    //   sm="9"
                    //   style={{ border: "1px solid #008F11", borderRadius: "10px", fontSize: "18px" }}
                    //   className=" mx-4  pt-3 mt-4"
                    // >
                    //   <Row className="align-content-center justify-content-center">
                    //     <Col
                    //       lg="7"
                    //       md="7"
                    //       sm="7"
                    //       className="justify-content-center align-content-center"
                    //     >
                    //       <p
                    //         className="text-center text-break"
                    //         style={{
                    //           fontWeight: "normal",
                    //           fontStyle: "normal",
                    //           fontSize: "0.8em",
                    //           fontFamily: "PT Sans",
                    //           color: "#ffffff",
                    //           userSelect: "none",
                    //           cursor: "default"
                    //         }}
                    //       >
                    //         You are selling{" "}
                    //         <b>
                    //           {value} BTC
                    //         {/* {_sendcoins.name} */}
                    //         </b>{" "}
                    //       for at least{" "}
                    //         <b>
                    //           {calcValue} DAI
                    //         {/* {_getcoins.name} */}
                    //         </b>
                    //         <br />
                    //       Expected Price Slippage: <b>{slippage}%</b>
                    //         <br />
                    //       Additional slippage limit: <b>{slippage}%</b>
                    //       </p>
                    //     </Col>
                    //   </Row>
                    //   {/* <p className="text-center text-break" style={{ fontWeight: "normal", fontStyle: "normal", fontSize: "0.8em", fontFamily: "PT Sans", color: "#ffffff" }}>
                    //                     You are selling <b>{sendvalue} {_sendcoins.name}</b> for at least <b>{sendvalue * rate} {_getcoins.name}</b> <br />Expected Price Slippage: <b>{slippage}%</b>  <br />Additional slippage limit: <b>{slippage}%</b>  <br />fee disclosures
                    //                 </p> */}
                    // </Col>
                  // )
                  
                  }
              </Row>
            ) : null}





            {window.location.pathname.split("/")[2] === "earn" ? null : (
              <Row className="justify-content-center align-content-center mx-auto">
                {_history.length > 0 ? (
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
                      style={{ fontSize: "0.8em", fontFamily: "PT Sans", color: "#00FF41" }}
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
                    {/* <Table responsive hover borderless className="mt-4">
                      <thead
                        style={{
                          fontSize: "0.8em",
                          fontFamily: "PT Sans",
                          color: "#ffffff",
                          backgroundColor: "#008F11",
                          borderRadius: "10px",
                          borderCollapse: "collapse",
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
                      <div>
                    </div>
                    </Table> */}
                    <div className="px-2" style={{
                      height: "4.2rem",
                      display: "flex",
                      flexDirection: "column",
                      flexGrow: "1"
                    }}>
                      <div style={{
                        flexDirection: "row",
                        display: "flex",
                        justifyContent: "space-around",
                        color: "white",
                        backgroundColor: "#008F11",
                        borderRadius: "10px",
                        height: "2.2rem"
                      }}>
                        <div style={{ width: "16.5%", marginTop: "auto", marginBottom: "auto" }}>Created</div>
                        <div style={{ width: "16.5%", marginTop: "auto", marginBottom: "auto" }}>Escrow Address</div>
                        <div style={{ width: "16.5%", marginTop: "auto", marginBottom: "auto" }}>Confirmations</div>
                        <div style={{ width: "16.5%", marginTop: "auto", marginBottom: "auto" }}>Sent</div>
                        <div style={{ width: "16.5%", marginTop: "auto", marginBottom: "auto" }}>Received</div>
                        <div style={{ width: "16.5%", marginTop: "auto", marginBottom: "auto" }}>Status</div>
                      </div>
                    </div>
                    {_history.map((eleos, i) => {
                      return (
                        <div className="px-2" style={{
                          height: "4.2rem",
                          display: "flex",
                          flexDirection: "column",
                          flexGrow: "1"
                        }}>
                          <TransactionRow
                            i={i}
                            created={eleos.created}
                            escrowAddress={eleos.escrowAddress(
                              (v) =>
                                v.substr(0, 6) +
                                "..." +
                                v.substr(v.length - 5, v.length)
                            )}
                            confirmations={eleos.confirmations}
                            btcBlock={btcBlock}
                            parcel={eleos.parcel}
                            sent={eleos.sent} sentName={eleos.sentName}
                            received={eleos.received} receivedName={eleos.receivedName}
                            status={eleos.status}
                            ismobile={ismobile}
                            setBlockTooltip={setBlockTooltip}
                            blocktooltip={blocktooltip}
                            _history={_history}
                            getPendingTransfers={getPendingTransfers}
                          />
                        </div>)
                    })}
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
      {/* <TransactionDetailsModal
        ismobile={ismobile}
        setBlockTooltip={setBlockTooltip}
        blocktooltip={blocktooltip}
        transactionModal={transactionModal}
        _history={_history}
        transactionDetails={transactionDetails}
        setTransactionModal={setTransactionModal}
      /> */}
    </>
  );
};

export default App;
