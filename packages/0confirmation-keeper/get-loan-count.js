'use strict';

const DB = require('./db');
const expandHomeDir = require('expand-home-dir');
const db = new DB(expandHomeDir('~/.0cf-keeper'));
const ethers = require('ethers');

(async () => {
  const data = String(ethers.utils.bigNumberify(Buffer.from(await db.get('index'))));
  console.log(data);
})().catch((err) => console.error(err));


