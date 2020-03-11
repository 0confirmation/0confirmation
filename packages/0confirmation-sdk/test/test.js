'use strict';

const ganache = require('@0confirmation/ganache');
const computeTestAddresses = require('@0confirmation/sol/deploy/compute-test-addresses');
const crypto = require('crypto');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const bip39 = require('bip39');
const mnemonic = bip39.generateMnemonic();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const provider = new HDWalletProvider('3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580', ganache.provider({
  mnemonic
}));
const mocks = computeTestAddresses(mnemonic);
const ethers = new Web3Provider(provider);

const Zero = require('../lib/sdk');

const fs = require('fs-extra');

describe('0confirmation sdk', () => {
  describe('0confirmation driver', async () => {
    it('should work', async () => {
      const borrower = new Zero({
        backends: {
          ethereum: {
            provider
          },
          zero: {
            multiaddr: 'lendnet',
            dht: false
          },
          renvm: {
            network: 'testnet'
          }
        },
        shifterPool: mocks.shifterPool
      });
      const keeper = new Zero({
        backends: {
          ethereum: {
            provider
          },
          zero: {
            multiaddr: 'lendnet',
            dht: false
          },
          renvm: {
            network: 'testnet'
          }
        },
        shifterPool: mocks.shifterPool
      });
      await borrower.driver.backends.zero.initialize();
      await keeper.driver.backends.zero.initialize();
      await keeper.driver.backends.zero.node.subscribe('/woop', (msg) => console.log(msg));
      await borrower.driver.backends.zero.node.publish('/woop', [{ woop: 'doop' }]);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    });
  });
});
/*
    it('should handle liquidity requests', async () => {
      const borrower = new Zero({
        backends: {
          ethereum: {
            provider
          },
          zero: {
            multiaddr: 'lendnet',
            dht: false
          },
          renvm: {
            network: 'testnet'
          }
        },
        shifterPool: mocks.shifterPool
      });
      await borrower.initializeDriver();
      const keeper = new Zero({
        backends: {
          ethereum: {
            provider
          },
          zero: {
            multiaddr: 'lendnet',
            dht: true
          },
          renvm: {
            network: 'testnet'
          }
        },
        shifterPool: mocks.shifterPool
      });
      await keeper.initializeDriver();
      await keeper.listenForLiquidityRequests((msg) => console.log(msg));
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const [ from ] = await ethers.send('eth_accounts', []);
      await borrower.broadcastLiquidityRequest({
        from,
        token: mocks.renbtc,
        amount: '1000',
        nonce: '0x' + crypto.randomBytes(32).toString('hex'),
        gasRequested: '1000'
      });
    });
*/
/*
  });
});
*/
