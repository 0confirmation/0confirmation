"use strict";

const CHAIN = process.env.CHAIN || "1";
const ethers = require("ethers");
const path = require("path");
const DB = require("./db");
const makeZero = require("./make-zero");
const environments = require("@0confirmation/sdk/environments");
const { makeEthersBase } = require("ethers-base");
const ERC20 = makeEthersBase(require("@0confirmation/sol/build/DAI"));
const THIRTY_MINUTES = 60 * 1000 * 30;

const chalk = require("chalk");
const { BigNumber } = require("@ethersproject/bignumber");

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) =>
  console.logBold(chalk.magenta("@0confirmation/keeper:info: ") + v);
console.errorKeeper = (v) =>
  console.error(chalk.bold(chalk.red("@0confirmation/keeper:error: ") + v));

const chainIdToName = (network) => {
  switch (network) {
    case "1":
      return "mainnet";
    case "42":
      return "testnet";
    default:
      return "buidler";
  }
};

const environment = environments.getAddresses(chainIdToName(CHAIN));

const logBalances = async (zero) => {
  const ethersProvider = zero.getProvider().asEthers();
  const from = await zero.getAddress();
  const balance = await ethersProvider.getBalance(from);
  const renbtc = new ERC20(await zero.getRenBTC(), zero.getSigner());
  const renbtcBalance = await renbtc.balanceOf(from);
  console.logKeeper(
    "ether balance: " + chalk.cyan(ethers.utils.formatEther(balance))
  );
  console.logKeeper(
    "renbtc balance: " + chalk.cyan(ethers.utils.formatUnits(renbtcBalance, 8))
  );
};

const installMocks = (zero) => {
  const ZeroMock = zero.constructor.ZeroMock;
  const mockZero = new ZeroMock(zero.getSigner());
  zero.driver.registerBackend(
    Object.assign(mockZero.driver.getBackendByPrefix("btc"), {
      driver: zero.driver,
    })
  );
  zero.driver.registerBackend(
    Object.assign(mockZero.driver.getBackendByPrefix("ren"), {
      driver: zero.driver,
    })
  );
  return zero;
};
const TEST_MODE = process.env.CHAIN === "31337";

(async () => {
  const zero = makeZero();
  if (TEST_MODE) installMocks(zero);
  const ethersProvider = zero.getProvider().asEthers();
  await zero.initializeDriver();
  await zero.startHandlingKeeperDiscovery();
  await zero.startHandlingBTCBlock();
  const from = await zero.getAddress();
  console.logKeeper("using network: " + chainIdToName(CHAIN));
  console.logKeeper("using address " + from);
  await logBalances(zero);
  const db = new DB(path.join(process.env.HOME, ".0cf-keeper"));
  const liquidityToken = await zero.getLiquidityTokenFor(
    await zero.getRenBTC()
  );
  const renbtc = new ERC20(await zero.getRenBTC(), zero.getSigner());
  const allowance = await renbtc.allowance(from, zero.shifterPool.address);
  if (allowance.lt("0x" + "ff".repeat(15))) {
    console.logKeeper("sending approve(address,uint256) to pool");
    const tx = await zero.approvePool(await zero.getRenBTC());
    console.logKeeper("transaction: " + tx.hash);
    await tx.wait();
    console.logKeeper("pool approved for renbtc!");
  }
  console.logKeeper("initializing -- ");
  const node = zero.driver.getBackend("zero").node;
  node.socket.on("peer:discovery", (peer) => {
    console.logKeeper("found a peer: " + peer.id.toB58String());
  });
  zero.listenForLiquidityRequests(async (v) => {
    try {
      console.logBold("received liquidity request over libp2p!");
      console.logKeeper("got liquidity request!");
      await logBalances(zero);
      console.logKeeper(
        "computing BTC address from liquidity request parameters: " +
          chalk.cyan(v.depositAddress)
      );
      console.logKeeper(
        "OK! " +
          chalk.yellow(v.proxyAddress) +
          " is a borrow proxy derived from a deposit of " +
          ethers.utils.formatUnits(v.amount, 8) +
          " BTC at the target address"
      );
      console.logKeeper("saving loan");
      await db.saveLoan(v);
      console.logKeeper("saved!");
      if (
        Number(ethers.utils.formatEther(v.gasRequested)) >
        Number(process.env.GAS_REQUESTED_CAP || "0")
      ) {
        console.logKeeper("request is for too much gas -- abort");
        return;
      }

      let deposited;
      deposited = await v.waitForDeposit(0, THIRTY_MINUTES);
      console.logKeeper("found deposit -- initializing a borrow proxy!");
      const result = await deposited.submitToRenVM();
      const bond = BigNumber.from(v.amount).div(9);
      await (
        await deposited.executeBorrow(bond, "10000", {
          gasLimit: "0x" + (1440000).toString(16),
        })
      ).wait();
      console.logKeeper("submitted to RenVM");
      const sig = await deposited.waitForSignature();
      const borrowProxy = await deposited.getBorrowProxy();
      console.logKeeper("repaying loan for " + deposited.proxyAddress + " !");
      await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(2e6) });
      await db.markLoanComplete(zero, deposited);
    } catch (e) {
      console.error(e);
    }
  });
})().catch((err) => console.error(err));

process.title = "keeper";
