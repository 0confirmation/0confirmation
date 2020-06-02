'use strict';

const DB = require('./db');
const expandHomeDir = require('expand-home-dir');
const db = new DB(expandHomeDir('~/.0cf-keeper'));
const ethers = require('ethers');
const makeZero = require('./make-zero');
const ln = (v, desc, depth) => {
  depth = depth === 'undefined' && 15 || depth;
  if (desc) console.log(desc);
  console.log(require('util').inspect(v, { colors: true, depth:depth }));
  return v;
};

(async () => {
  const zero = makeZero();
  console.log(zero);
  await zero.initializeDriver();
  const loan = await db.getLoan(process.env.INDEX, zero);
  ln(loan, 'loan details:', 1);
  ln(loan.zero.driver, 'zero', 2);
/*
  const deposited = await loan.waitForDeposit();
  ln(deposited, 'deposited', 0);
  ln(deposited.utxo, 'utxo details:');
*/
  ln(loan, 'loan details: ', 1);
  const proxy = await loan.getBorrowProxy();
  ln(proxy.address, 'proxy address:');
})().catch((err) => console.error(err));


