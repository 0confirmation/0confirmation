'use strict';

const RenJS = require('@renproject/ren');
global._bitcore = undefined;
global._bitcoreCash = undefined;
const Zero = require('@0confirmation/sdk');
global._bitcore = undefined;
global._bitcoreCash = undefined;
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ethers = require('ethers');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const kovan = require('@0confirmation/sol/environments/kovan');

const throwError = (err) => { throw Error(err); };

const setupProvider = (network) => {
  let url;
  switch (network) {
    case 'lendnet':
      url = (new ethers.providers.InfuraProvider('kovan')).connection.url;
      break;
    default:
      url = network || throwError('Must supply $NETWORK to target a chain')
  }
  return new HDWalletProvider(process.env.SEED || throwError('Must supply $SEED which can be a mnemonic or private key without 0x prefix'), url);
};

const toEthers = (provider) => new ethers.provider.Web3Provider(provider);

const getChainId = async (provider) => {
  return String(Number(await (toEthers(provider)).send('eth_chainId', [])));
};

const getEnvironment = (network) => {
  const provider = setupProvider(network);
  switch (network) {
    case 'lendnet':
      return {
        backends: {
          ethereum: {
            provider
          },
          renvm: {
            network: 'testnet'
          },
          btc: {
            network: 'testnet'
          },
          zero: {
            multiaddr: 'lendnet',
            dht: true
          }
        },
        borrowProxyLib: BorrowProxyLib.networks[42].address,
        shifterPool: ShifterPool.networks[42].address,
        renbtc: RenJS.NetworkDetails.NetworkTestnet.contracts.addresses.tokens.BTC.address,
        mpkh: RenJS.NetworkDetails.NetworkTestnet.contracts.renVM.mpkh
      };
    default:
      throwError('unsupported network: ' + network);
  }
};

const chalk = require('chalk');

const makeZero = async (env) => {
  const zero = new Zero(env);
  await zero.initializeDriver();
  return zero;
};

console.logBold = (v) => console.log(chalk.bold(v));
console.logKeeper = (v) => console.logBold(chalk.magenta('keeper: ') + v);


(async () => {
  const network = process.env.NETWORK;
  const env = getEnvironment(network);
  const zero = await makeZero(env);
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
