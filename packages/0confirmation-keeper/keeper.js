'use strict';

const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const ethers = require('ethers');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : '';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');

const provider = fromPrivate(process.env.PRIVATE, fromEthers(new ethers.providers.InfuraProvider(ETH_NETWORK)));

const chalk = require('chalk');

const makeZero = async () => {
  const zero = new Zero(provider, NETWORK);
  await zero.initializeDriver();
  return zero;
};

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const zero = await makeZero();
  console.log('approving shifter pool for bonds');
//  await (await zero.approvePool(env.renbtc)).wait();
  console.log('approved!');
  zero.listenForLiquidityRequests(async (v) => {
    console.logBold('received liquidity request over libp2p!');
    console.logKeeper('got liquidity request!');
    console.logKeeper('computing BTC address from liquidity request parameters: ' + chalk.cyan(v.depositAddress));
    console.logKeeper('OK! ' + chalk.yellow(v.proxyAddress) + ' is a borrow proxy derived from a deposit of ' + ethers.utils.formatUnits(v.amount, 8) + ' BTC at the target address');
    if (Number(ethers.utils.parseEther(v.gasRequested)) > 0.1) {
      console.logKeeper('request is for too much gas -- abort');
      return
    }
    const deposited = await v.waitForDeposit();
    console.logKeeper('found deposit -- initializing a borrow proxy!')
    const bond = ethers.utils.bigNumberify(v.amount).div(9);
    await (await deposited.executeBorrow(bond, '100000')).wait();
    const result = await deposited.submitToRenVM();
    const sig = await deposited.waitForSignature();
    try {
      const borrowProxy = await deposited.getBorrowProxy();
      console.logKeeper('repaying loan for ' + deposited.proxyAddress + ' !');
      await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) });
    } catch (e) {
      deferred.reject(e);
    }
  });
})().catch((err) => console.error(err));
