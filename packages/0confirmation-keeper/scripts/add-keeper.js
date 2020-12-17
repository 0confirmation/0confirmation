'use strict';

const zero = require('../make-zero')();
const ethers = require('ethers');
const signer = new ethers.providers.JsonRpcProvider('http://localhost:8545').getSigner();
const shifterPool = new ethers.Contract(ethers.constants.AddressZero, zero.shifterPool.abi, signer);
(async () => {
  const address = await zero.getAddress();
  console.log('keeper', address);
  const tx = await shifterPool.attach(zero.shifterPool.address).setKeeper(address, true);
  console.log(tx.hash);
  console.log(await tx.wait());
})().catch((err) => console.error(err));
