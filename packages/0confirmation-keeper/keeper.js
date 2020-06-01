'use strict';

const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const ethers = require('ethers');
const path = require('path');
const CHAIN = process.env.CHAIN;
const NETWORK = CHAIN === '1' ? 'mainnet' : CHAIN === '42' ? 'testnet' : 'mainnet';
const ETH_NETWORK = NETWORK === 'testnet' ? 'kovan' : NETWORK;
const Zero = require('@0confirmation/sdk');
const LiquidityRequestParcel = require('@0confirmation/sdk/liquidity-request-parcel');
const environments = require('@0confirmation/sdk/environments');
const level = require('level');
const env = environments.getAddresses(ETH_NETWORK);
const PromiseQueue = require('promiseq');

const toNumber = (v) => Number(ethers.utils.bigNumberify(ethers.utils.arrayify(Buffer.from(v))));

const toBuffer = (v) => Buffer.from(ethers.utils.arrayify(ethers.utils.bigNumberify(v)));

const toAscii = (v) => ethers.utils.toUtf8String(ethers.utils.arrayify(v));

class DB {
  constructor(path) {
    this.level = level(path);
    this._queue = new PromiseQueue(1);
  }
  queue(job) {
    return this._queue.push(() => Promise.resolve().then(() => job()));
  }
  get(k) {
    return this.queue(() => this._get(k));
  }
  put(k, v) {
    return this.queue(() => this._put(k, v));
  }
  saveLoan(loan) {
    return this.queue(async () => {
      const fromDb = await this._get('index');
      console.log(fromDb);
      const index = fromDb === null ? 0 : toNumber(fromDb) + 1;
      await this._put(toBuffer(index), JSON.stringify({
        shifterPool: loan.shifterPool,
        token: loan.token,
        nonce: loan.nonce,
        amount: loan.amount,
        gasRequested: loan.gasRequested,
        signature: loan.signature,
        actions: loan.actions,
        forbidLoan: loan.forbidLoan,
        borrower: loan.borrower,
        resolved: false
      }));
      await this._put(loan.proxyAddress, toBuffer(index))
      await this._put('index', toBuffer(index))
      return loan;
    });
  }
  markLoanComplete(zero, loan) {
    return this.queue(async () => {
      const parcel = new LiquidityRequestParcel({
        zero,
        ...loan
      });
      const index = toNumber((await this._get(toBuffer(parcel.proxyAddress))) || Buffer.from([0x0]));
      const loan = toAscii((await this._get(toBuffer(index))) || Buffer.from([]));
      if (loan) {
        const parsed = JSON.parse(loan);
        parsed.resolved = true;
        await this._put(toBuffer(index), JSON.stringify(parsed));
      }
      return loan;
    });
  }
  _get(v) {
    return new Promise((resolve, reject) => {
      this.level.get(v, (err, result) => {
        if (err) {
          if (err.name === 'NotFoundError') return resolve(null);
          return reject(err);
        }
        resolve(result);
      });
    });
  }
  _put(k, v) {
    return new Promise((resolve, reject) => {
      this.level.put(k, v, (err) => err ? reject(err) : resolve());
    });
  }
}

const provider = fromPrivate(process.env.PRIVATE_KEY, fromEthers(new ethers.providers.InfuraProvider(ETH_NETWORK)));

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
      gasPrice: ethers.utils.parseUnits('25', 9)
    })).wait();
    const result = await deposited.submitToRenVM();
    const sig = await deposited.waitForSignature();
    try {
      const borrowProxy = await deposited.getBorrowProxy();
      console.logKeeper('repaying loan for ' + deposited.proxyAddress + ' !');
      await borrowProxy.repayLoan({ gasLimit: ethers.utils.hexlify(6e6) });
      await db.markLoanComplete(zero, deposited);
    } catch (e) {
      deferred.reject(e);
    }
  });
})().catch((err) => console.error(err));
