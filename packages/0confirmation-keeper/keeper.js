'use strict';

const ethers = require('ethers');
const path = require('path');
const DB = require('./db');
const makeZero = require('./make-zero');

const chalk = require('chalk');

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const zero = makeZero();
  await zero.initializeDriver();
  const db = new DB(path.join(process.env.HOME, '.0cf-keeper'));
  console.log('approving shifter pool for bonds');
//  await (await zero.approvePool(env.renbtc)).wait();
  console.log('approved!');
  const node = zero.driver.getBackend('zero').node;
  node.socket.on('peer:discovery', (peer) => {
    console.log(peer);
  });
  zero.listenForLiquidityRequests(async (v) => {
    console.logBold('received liquidity request over libp2p!');
    console.logBold('saving loan');
    await db.saveLoan(v);
    console.logBold('saved!');
    console.logKeeper('got liquidity request!');
    console.logKeeper('computing BTC address from liquidity request parameters: ' + chalk.cyan(v.depositAddress));
    console.logKeeper('OK! ' + chalk.yellow(v.proxyAddress) + ' is a borrow proxy derived from a deposit of ' + ethers.utils.formatUnits(v.amount, 8) + ' BTC at the target address');
    if (Number(ethers.utils.formatEther(v.gasRequested)) > Number(process.env.GAS_REQUESTED_CAP || '0')) {
      console.logKeeper('request is for too much gas -- abort');
      return
    }
    const deposited = await v.waitForDeposit();
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
      console.error(e);
    }
  });
})().catch((err) => console.error(err));
