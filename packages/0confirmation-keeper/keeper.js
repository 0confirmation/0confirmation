'use strict';

const CHAIN = process.env.CHAIN || '42';
const ethers = require('ethers');
const path = require('path');
const DB = require('./db');
const makeZero = require('./make-zero');
const environments = require('@0confirmation/sdk/environments');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const ERC20 = makeManagerClass(require('@0confirmation/sol/build/DAI'));
const THIRTY_MINUTES = 60*1000*30;

const chalk = require('chalk');

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('@0confirmation/keeper:info: ') + v);
console.errorKeeper = (v) => console.error(chalk.bold(chalk.red('@0confirmation/keeper:error: ') + v));

const chainIdToName = (network) => {
  switch (network) {
    case '1':
      return 'mainnet';
    case '42':
      return 'testnet';
    default:
      return 'ganache';
  }
};

const environment = environments.getAddresses(chainIdToName(CHAIN));

const logBalances = async (zero) => {
  const ethersProvider = zero.getProvider().asEthers();
  const [ from ] = await ethersProvider.listAccounts();
  const balance = await ethersProvider.getBalance(from);
  const renbtc = new ERC20(environment.renbtc, ethersProvider);
  const renbtcBalance = await renbtc.balanceOf(from);
  console.logKeeper('ether balance: ' + chalk.cyan(ethers.utils.formatEther(balance)));
  console.logKeeper('renbtc balance: ' + chalk.cyan(ethers.utils.formatUnits(renbtcBalance, 8)));
};

(async () => {
  const zero = makeZero();
  const ethersProvider = zero.getProvider().asEthers();
  await zero.initializeDriver();
  const [ from ] = await ethersProvider.listAccounts();
  console.logKeeper('using network: ' + chainIdToName(CHAIN));
  console.logKeeper('using address ' + from);
  await logBalances(zero);
  const db = new DB(path.join(process.env.HOME, '.0cf-keeper'));
  const liquidityToken = await zero.getLiquidityTokenFor(environment.renbtc);
  const renbtc = new ERC20(environment.renbtc, ethersProvider);
  const allowance = await renbtc.allowance(from, liquidityToken.address);
  if (allowance.lt('0x' + 'ff'.repeat(30))) {
    console.logKeeper('sending approve(address,uint256) to pool');
    const tx = await zero.approvePool(environment.renbtc);
    console.logKeeper('transaction: ' + tx.hash);
    await tx.wait();
    console.logKeeper('pool approved for renbtc!');
  }
  console.logKeeper('initializing -- ');
  const node = zero.driver.getBackend('zero').node;
  node.socket.on('peer:discovery', (peer) => {
    console.logKeeper('found a peer: ' + peer.id.toB58String());
  });
  zero.listenForLiquidityRequests(async (v) => {
    console.logBold('received liquidity request over libp2p!');
    console.logKeeper('got liquidity request!');
    await logBalances(zero);
    console.logKeeper('computing BTC address from liquidity request parameters: ' + chalk.cyan(v.depositAddress));
    console.logKeeper('OK! ' + chalk.yellow(v.proxyAddress) + ' is a borrow proxy derived from a deposit of ' + ethers.utils.formatUnits(v.amount, 8) + ' BTC at the target address');
    console.logKeeper('saving loan');
    await db.saveLoan(v);
    console.logKeeper('saved!');
    if (Number(ethers.utils.formatEther(v.gasRequested)) > Number(process.env.GAS_REQUESTED_CAP || '0')) {
      console.logKeeper('request is for too much gas -- abort');
      return
    }
    
    let deposited;
    try {
      deposited = await v.waitForDeposit(0, THIRTY_MINUTES);
    } catch (e) {
      console.errorKeeper('dimeout waiting for ' + chalk.cyan(v.depositAddress));
      return;
    }
    console.logKeeper('found deposit -- initializing a borrow proxy!')
    const bond = ethers.utils.bigNumberify(v.amount).div(9);
    await (await deposited.executeBorrow(bond, '10000', {
      gasLimit: '0x' + (1200000).toString(16),
      gasPrice: ethers.utils.parseUnits('30', 9)
    })).wait();
    const result = await deposited.submitToRenVM();
    console.logKeeper('submitted to RenVM')
    const sig = await deposited.waitForSignature();
    try {
      const borrowProxy = await deposited.getBorrowProxy();
      console.logKeeper('repaying loan for ' + deposited.proxyAddress + ' !');
      await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(2e6), gasPrice: ethers.utils.parseUnits('30', 9) });
      await db.markLoanComplete(zero, deposited);
    } catch (e) {
      console.errorKeeper(e.stack);
    }
  });
})().catch((err) => console.errorKeeper(err.stack));
