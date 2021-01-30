'use strict';

const makeZero = require('../make-zero');
const DB = require('../db');
const path = require('path');

(async () => {
  const db = new DB(path.join(process.env.HOME, '.0cf-keeper'));
  const zero = makeZero();
  console.log(JSON.stringify(await db.getAllLoans(zero)));
})().catch((err) => console.error(err));
