'use strict';

const DB = require('./db');
const expandHomeDir = require('expand-home-dir');
const db = new DB(expandHomeDir('~/.0cf-keeper'));
const ethers = require('ethers');

(async () => {
  const data = JSON.parse(await db.get(DB.toBuffer(Number(process.env.INDEX))));
  console.log(require('util').inspect(data, { colors: true, depth: 15  }));
})().catch((err) => console.error(err));


