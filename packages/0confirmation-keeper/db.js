'use strict';

const level = require('level');
const PromiseQueue = require('promiseq');
const ethers = require('ethers');
const LiquidityRequestParcel = require('@0confirmation/sdk/liquidity-request-parcel');

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
  async getLoan(k, zero = {}) {
    const data = JSON.parse(await this.get(DB.toBuffer(Number(k))));
    data.amount = ethers.utils.bigNumberify(data.amount._hex).toString();
    delete data.borrower;
    delete data.proxyAddress;
    delete data.depositAddress;
    return new LiquidityRequestParcel({
      ...data,
      zero
    });
  }
  saveLoan(loan) {
    return this.queue(async () => {
      const fromDb = await this._get('index');
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
      const decodedLoan = ((await this._get(toBuffer(index))) || '{}');
      if (decodedLoan) {
        const parsed = JSON.parse(decodedLoan);
        parsed.resolved = true;
        await this._put(toBuffer(index), JSON.stringify(parsed));
      }
      return decodedLoan;
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

DB.toNumber = toNumber;
DB.toAscii = toAscii;
DB.toBuffer = toBuffer;

module.exports = DB;
