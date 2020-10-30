'use strict';

const wallet = require('ethereumjs-wallet');
const pvt = wallet.fromV3(require('./private/mainnet'), process.env.SECRET).getPrivateKeyString();
const ethers = require('ethers');

const BTCBackend = require('@0confirmation/sdk/backends/btc/btc');
const btcBackend = new BTCBackend({});
const signer = new ethers.Wallet(pvt).connect(new ethers.providers.InfuraProvider('mainnet'));

const ShifterPool = require('./deployments/live_1/ShifterPool');
const fromPrivate = require('@0confirmation/providers/private-key-or-seed');
const fromEthers = require('@0confirmation/providers/from-ethers');
const provider = fromPrivate(pvt.substr(2), fromEthers(new ethers.providers.InfuraProvider('mainnet')));
const LiquidityRequestParcel = require('@0confirmation/sdk/liquidity-request-parcel');
const Zero = require('@0confirmation/sdk');

const zero = new Zero(provider, 'mainnet');
zero.driver.prefixes.btc = btcBackend;

const fs = require('fs');
const payload = require('./loan');
const shifterPool = new ethers.Contract(ShifterPool.address, ShifterPool.abi, signer);

const ln = (v) => ((console.log(v)), v);
let parcel = zero.createLiquidityRequest(payload).toParcel(payload.signature);
const { BigNumber } = require('@ethersproject/bignumber');

(async () => {
  parcel.utxo = {
    vOut: 25,
    txHash: '0xf33f82eb10249a2a70f7126bdccd481e4fa7516d0c266748ae51b5839d86d063'
  };
  const deposited = parcel.toDeposit(parcel.utxo);
    /*
  const bond = BigNumber.from(parcel.amount).div(9).toString();
  const timeout = '10000';
  const tx = await deposited.executeBorrow(bond, timeout, { gasLimit: 1.4e6, gasPrice: ethers.utils.parseUnits('100', 9) });
  console.log(tx.hash);
  console.log(await tx.wait());
  parcel.utxo = {
    vOut: 0,
    txHash: '0xded9ae07862184a4f927ad60ccc5db2d9b927a3eea917fdda9e8e70a60360ed3'
  };
  */
  await deposited.submitToRenVM();
  const proxy = await parcel.getBorrowProxy();
    console.log(proxy);
  const tx = await proxy.repayLoan({ gasLimit: 1.2e6 });
  console.log(tx.hash);
  const receipt = await tx.wait();
  console.log(require('util').inspect(receipt, { colors: true, depth: 15 }));
  process.exit(0);
})().catch(console.error);
