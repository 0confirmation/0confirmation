'use strict';

const { RenVMType } = require('@renproject/ren-js-common');
const { soliditySha3 } = require('web3-utils');
const { toBase64 } = require('./util');
const RenJS = require('@renproject/ren');
const ethersUtil = require('ethers/utils');
const ethers = require('ethers');
const utils = require('./util');
const Driver = require('./driver');
const { Web3Provider } = require('ethers/providers/web3-provider');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');

class UTXOWrapper {
  constructor({
    request,
    utxo
  }) {
    Object.assign(this, {
      request,
      utxo
    });
  }
  async submitToRenVM() {
    return await this.request.zero.submitToRenVM({
      token: this.request.message.token,
      amount: this.request.message.amount,
      nonce: this.request.message.nonce,
      proxyAddress: this.request.proxyAddress,
      utxo: this.utxo
    });
  }
}

class LiquidityRequestParcel {
  constructor({
    zero,
    shifterPool,
    token,
    nonce,
    amount,
    gasRequested,
    signature
  }) {
    const borrower = ethersUtil.verifyMessage(utils.computeLiquidityRequestHash({
      shifterPool,
      token,
      nonce,
      amount,
      gasRequested
    }), signature);
    const proxyAddress = utils.computeBorrowProxyAddress({
      shifterPool,
      borrower,
      token,
      nonce,
      amount
    });
    const depositAddress = utils.computeGatewayAddress({
      isTestnet: zero.network.isTestnet,
      mpkh: zero.network.mpkh,
      g: {
        to: proxyAddress,
        p: [],
        tokenAddress: token,
        nonce
      }
    });
    Object.assign(this, {
      message: {
        shifterPool,
        token,
        nonce,
        amount,
        gasRequested,
        signature
      },
      borrower,
      depositAddress,
      proxyAddress,
      zero
    });
  }
  async broadcast() {
    return await this.zero.driver.sendWrapped('0cf_broadcastLiquidityRequest', [ this.message ]);
  }
  async executeBorrow(bond, timeoutExpiry, overrides) {
    return await this.zero.executeBorrow(this, bond, timeoutExpiry, overrides);
  }
  async waitForDeposit() {
    let utxos;
    while (true) {
      utxos = await (this.zero.driver.sendWrapped('btc_getUTXOs', [{
        confirmations: 0,
        address: this.depositAddress
      }]));
      if (utxos.length === 0) await new Promise((resolve) => setTimeout(resolve, 5000));
      else break;
    }
    return new UTXOWrapper({
      request: this,
      utxo: utxos[0]
    });
  }
}

class LiquidityRequest {
  constructor ({
    zero,
    from,
    shifterPool,
    token,
    nonce,
    amount,
    gasRequested
  }) {
    Object.assign(this, {
      shifterPool,
      token,
      nonce,
      amount,
      gasRequested
    });
  }
  async sign() {
    const signature = await zero.driver.sendWrapped('personal_sign', [ utils.computeLiquidityRequestHash({
      shifterPool: this.shifterPool,
      token: this.token,
      nonce: this.nonce,
      amount: this.amount,
      gasRequested: this.gasRequested
    }), from ]);
    return new LiquidityRequestParcel(Object.assign({}, this, {
      signature
    }));
  }
}

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
  createLiquidityRequest({
    from,
    token,
    amount,
    nonce,
    gasRequested
  }) {
    return new LiquidityRequest({
      zero: this,
      shifterPool: this.network.shifterPool,
      token,
      amount,
      nonce,
      gasRequested,
      from
    });
  }
  async broadcastLiquidityRequest({
    from,
    token,
    amount,
    nonce,
    gasRequested
  }) {
    const liquidityRequest = this.createLiquidityRequest({
      token,
      amount,
      nonce,
      gasRequested,
      from
    });
    const parcel = await liquidityRequest.sign();
    await parcel.broadcast();
    return parcel;
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
      callback(new LiquidityRequestParcel({
        zero: this,
        shifterPool,
        token,
        nonce,
        amount,
        gasRequested,
        signature
      }));
    });
  }
  async approvePool(token, overrides) {
    const contract = new ethers.Contract(token, LiquidityToken.abi, new Web3Provider(this.driver));
    return await contract.approve(this.network.shifterPool, '0x' + Array(64).fill('f').join(''), overrides);
  }
  async getLiquidityTokenFor(token) {
    const contract = new ethers.Contract(this.network.shifterPool, ShifterPool.abi, new Web3Provider(this.driver));
    const liquidityToken = new ethers.Contract(await contract.getLiquidityTokenHandler(token), LiquidityToken.abi);
    return liquidityToken;
  }
  async approveLiquidityToken(token, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    const contract = new ethers.Contract(token, LiquidityToken.abi, new Web3Provider(this.driver));
    return await contract.approve(liquidityToken.address, '0x' + Array(64).fill('f').join(''), overrides);
  }
  async addLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    await liquidityToken.addLiquidity(ethersUtil.parseEther(value), overrides);
  }
  async removeLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    await liquidityToken.removeLiquidityToken(ethersUtil.parseEther(value), overrides);
  }
  async executeBorrow(liquidityRequest, bond, timeoutExpiry, overrides) {
    const { 
      message: {
        shifterPool,
        token,
        nonce,
        amount,
        gasRequested,
        signature
      },
      borrower
    } = liquidityRequest;
    const contract = new ethers.Contract(this.network.shifterPool, ShifterPool.abi, new Web3Provider(this.driver.getBackend('ethereum')));
    await contract.executeBorrow({
      request: {
        borrower,
        token,
        nonce,
        amount
      },
      gasRequested
      signature
    }, ethersUtil.parseEther(bond), timeoutExpiry, overrides);
    return tx;
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

module.exports = Zero;
