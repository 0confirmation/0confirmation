'use strict';

var shifterPoolAbi = require('./artifacts/ShifterPool');
var shifterPoolEvents = require('./artifacts/BorrowProxyLib');
var ethers = require('ethers');
var provider = new ethers.providers.InfuraProvider('mainnet', '2f1de898efb74331bf933d3ac469b98d');
var wallet = new ethers.Wallet('0xbe33847835a01b5d81d2109a173643a85b7eb17454c687af43f266b3dc7afdca', provider);
var gasnow = require('ethers-gasnow');
var contract = new ethers.Contract(require('./deployments/live/ShifterPool').address, shifterPoolAbi.abi.concat(shifterPoolEvents.abi), provider);
var getLogs = async () => {
  const filter = { ...contract.filters.BorrowProxyMade() };
  delete filter.address;
  filter.fromBlock = 10164101;
  const logs = await provider.getLogs(filter);
  return logs.map((v) => ({
     event: contract.interface.parseLog(v),
     ...v
  }));
};
  
var ShifterBorrowProxy = require('./artifacts/ShifterBorrowProxy');

var getBorrowProxy = (log) => new ethers.Contract(log.args.proxyAddress, ShifterBorrowProxy.abi, wallet);

var getBorrowProxies = async () => {
  const logs = await getLogs();
  const proxies = logs.map((v) => getBorrowProxy(v.event));
  return [ logs, proxies ];
};

var renbtc = new ethers.Contract('0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', [ 'function balanceOf(address) view returns (uint256)' ], wallet);
var dai = new ethers.Contract('0x6b175474e89094c44da98b954eedeac495271d0f', ['function balanceOf(address) view returns (uint256)' ], wallet);

var computeAssetForwarderAddress = require('../0confirmation-sdk/util/compute-asset-forwarder-address');

var getEscrowWallets = async () => {
  const proxies = await getBorrowProxies();
  return proxies[1].map((v, i) => computeAssetForwarderAddress(proxies[0][i].address, v.address, 0));
};
