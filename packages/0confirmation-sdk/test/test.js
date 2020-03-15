'use strict';

const crypto = require('crypto');
const Web3Provider = require('ethers/providers/web3-provider').Web3Provider;
const bip39 = require('bip39');
const mnemonic = bip39.generateMnemonic();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache-cli');
const key = '3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580';
const provider = new HDWalletProvider(key, ganache.provider({
  mnemonic
}));
const ethersModule = require('ethers');
const { send } = provider;
provider.send = async (o) => {
  if (o.method === 'personal_sign') {
    const wallet = new ethersModule.Wallet('0x' + key);
    return {
      jsonrpc: '2.0',
      id: o.id,
      result: wallet.signMessage(o.params[0])
    };
  }
  else return send.call(provider, o);
};
const ethers = new Web3Provider(provider);

const Zero = require('../lib/sdk');

const fs = require('fs-extra');

describe('0confirmation sdk', () => {
  describe('0confirmation driver', async () => {
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
            network: 'devnet'
          },
          btc: {
            network: 'testnet'
          }
        },
        shifterPool: '0x' + Array(40).fill('1').join('')
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
            network: 'devnet'
          },
          btc: {
            network: 'testnet'
          }
        },
        shifterPool: '0x' + Array(40).fill('1').join('')
      });
      await keeper.initializeDriver();
      console.log('keeper peer-info: ');
      console.log(keeper.driver.backends.zero.node.socket.peerInfo.multiaddrs._multiaddrs[0]);
      console.log('borrower peer-info: ');
      console.log(borrower.driver.backends.zero.node.socket.peerInfo.multiaddrs._multiaddrs[0]);
      console.log('keeper listening for liquidity requests...');
      await keeper.listenForLiquidityRequests((msg) => {
        console.log('liquidity request received .. computing gateway address and proxy address: ');
        console.log(msg);
        console.log('send btc to deposit address, watch BTC chain for deposit then issue transaction ..');
      });
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const [ from ] = await ethers.send('eth_accounts', []);
      console.log('requesting 1000 renbtc and 1000 wei for gas:');
      const ln = (v) => ((console.log(v)), v);
      console.log('broadcast details: ');
      await borrower.broadcastLiquidityRequest(ln({
        from,
        token: '0x' + Array(40).fill('f').join(''),
        amount: '1000',
        nonce: '0x' + crypto.randomBytes(32).toString('hex'),
        gasRequested: '1000'
      }));
      await new Promise((resolve) => setTimeout(resolve, 10000));
    });
  });
});
