'use strict';

const ganache = require('@0confirmation/ganache');
const computeTestAddresses = require('@0confirmation/sol/deploy/compute-test-addresses');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const bip39 = require('bip39');
const mnemonic = bip39.generateMnemonic();
const provider = ganache.provider({
  mnemonic
});
const mocks = computeTestAddresses(mnemonic);
const ethers = new Web3Provider(provider);

const ZeroDriver = require('../lib/driver');

const fs = require('fs-extra');

describe('0confirmation sdk', () => {
  describe('0confirmation driver', async () => {
    it('should handle liquidity requests', async () => {
      const borrower = new ZeroDriver({
        ethereum: {
          provider: ethers
        },
        zero: {
          multiaddr: 'lendnet'
        },
        renvm: {
          network: 'testnet'
        }
      });
      await borrower.initialize();
      const keeper = new ZeroDriver({
        ethereum: {
          provider: ethers
        },
        zero: {
          multiaddr: 'lendnet'
        },
        renvm: {
          network: 'testnet'
        }
      });
      await keeper.initialize();
      const id = await keeper.sendWrapped('0cf_filterLiquidityRequests', []);
      console.log('woop');
      console.log(id);
      const broadcast = await borrower.sendWrapped('0cf_broadcastLiquidityRequest', [{ woop: 'doop' }]);
      console.log(broadcast);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const ln = (v) => ((console.log(v)), v);
      ln(await keeper.sendWrapped('0cf_getFilterUpdates', [ id ]));
    });
  });
});
