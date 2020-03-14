'use strict';

const { RenVMType } = require('@renproject/ren-js-common');
const { soliditySha3 } = require('web3-utils');
const { toBase64 } = require('./util');
const RenJS = require('@renproject/ren');
const ethersUtil = require('ethers/utils');
const utils = require('./util');
const Driver = require('./driver');

class Zero {
  constructor({
    backends,
    shifterPool,
    mpkh
  }) {
    this.options = {
      shifterPool,
      mpkh
    };
    this.driver = new Driver(backends);
    const isTestnet = this.driver.getBackend('btc').testnet;
    this.network = {
      mpkh: mpkh || this.driver.backends.renvm.ren.network.contracts.renVM.mpkh,
      shifterPool: shifterPool,
      isTestnet
    };
  }
  async broadcastLiquidityRequest({
    from,
    token,
    amount,
    nonce,
    gasRequested
  }) {
    const signature = await (this.driver.getBackend('ethereum')).sendWrapped('personal_sign', [ ethersUtil.solidityKeccak256([
      'address',
      'address',
      'bytes32',
      'uint256',
      'uint256'
    ], [
      this.network.shifterPool,
      token,
      nonce,
      amount,
      gasRequested
    ]), from ]);
    await this.driver.sendWrapped('0cf_broadcastLiquidityRequest', [{
      shifterPool: this.network.shifterPool,
      token,
      amount,
      nonce,
      gasRequested,
      signature
    }]);
    const proxyAddress = utils.computeBorrowProxyAddress({
      shifterPool,
      borrower,
      token,
      nonce,
      amount
    });
    const depositAddress = utils.computeGatewayAddress({
      isTestnet: this.options.isTestnet,
      mpkh: this.network.mpkh,
      g: {
        to: proxyAddress,
        p: [],
        tokenAddress: token,
        nonce
      }
    });
    return {
      proxyAddress,
      depositAddress
    };
  } 
  async submitToRenVM({
    token,
    amount,
    proxyAddress,
    nonce,
    utxo
  }) {
    return await this.driver.sendWrapped('ren_submitTx', [{
      to: RenJS.Tokens.BTC.Mint,
      in: [{
        name: 'phash',
        type: RenVMType.TypeB32,
        value: toBase64(soliditySha3(''))
      }, {
        name: 'amount',
        type: RenVMType.TypeU64,
        value: toBase64(amount)
      }, {
        name: 'token',
        type: RenVMType.ExtTypeEthCompatAddress,
        value: toBase64(token)
      }, {
        name: 'n',
        type: RenVMType.TypeB32,
        value: toBase64(nonce)
      }, {
        name: 'utxo',
        type: RenVMType.ExtTypeBtcCompatUTXO,
        value: utxo
      }]
    }]);
  }
  async listenForLiquidityRequests(callback) {
    return await (this.driver.getBackend('zero'))._filterLiquidityRequests((msg) => {
      const [{
        shifterPool,
        token,
        amount,
        nonce,
        gasRequested,
        signature
      }] = msg.data.params;
      if (shifterPool !== this.network.shifterPool) return;
      const borrower = ethersUtil.verifyMessage(ethersUtil.solidityKeccak256([
        'address',
        'address',
        'bytes32',
        'uint256',
        'uint256'
      ], [
        shifterPool,
        token,
        nonce,
        amount,
        gasRequested
      ]), signature);
      const proxyAddress = utils.computeBorrowProxyAddress({
        shifterPool,
        borrower,
        token,
        nonce,
        amount
      });
      const depositAddress = utils.computeGatewayAddress({
        isTestnet: this.options.isTestnet,
        mpkh: this.network.mpkh,
        g: {
          to: proxyAddress,
          p: [],
          tokenAddress: token,
          nonce
        }
      });
      callback({
        message: {
          shifterPool,
          token,
          nonce,
          amount,
          gasRequested,
          signature
        },
        depositAddress,
        proxyAddress
      });
    });
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

module.exports = Zero;
