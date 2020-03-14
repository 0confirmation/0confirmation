'use strict';

const UTXO_POLL_INTERVAL = 5000;

const { RenVMType } = require('@renproject/ren-js-common');
const { toBase64 } = require('./util');
const RenJS = require('@renproject/ren');
const ethersUtil = require('ethers/utils');
const ethers = require('ethers');
const utils = require('./util');
const abi = ethersUtil.defaultAbiCoder;
const Driver = require('./driver');
const { Web3Provider } = require('ethers/providers/web3-provider');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const Exports = require('@0confirmation/sol/build/Exports');

const KECCAK256_NULL = '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563';

const ProxyRecordABI = Exports.abi.find((v) => v.name === 'ProxyRecordExport').inputs[0];
const TriggerParcelABI = Exports.abi.find((v) => v.name === 'TriggerParcelExport').inputs[0];

const decodeProxyRecord = (input) => abi.decode([ ProxyRecordABI ], input)[0];
const encodeTriggerParcel = (input) => abi.encode([ TriggerParcelABI ], [ input ]);

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
      if (utxos.length === 0) await new Promise((resolve) => setTimeout(resolve, UTXO_POLL_INTERVAL));
      else break;
    }
    return new UTXOWrapper({
      request: this,
      utxo: utxos[0]
    });
  }
}

class BorrowProxy {
  constructor ({
    zero,
    shifterPool,
    user,
    proxyAddress,
    record
  }) {
    this.zero = zero;
    this.shifterPool = shifterPool; 
    this.user = user;
    this.proxyAddress = proxyAddress;
    this.record = record;
    this.decodedRecord = decodedRecord || decodeProxyRecord(record);
    this.depositAddress = this.computeDepositAddress();
  }
  computeDepositAddress() {
    const proxyAddress = this.proxyAddress;
    const isTestnet = this.zero.network.isTestnet;
    const mpkh = this.zero.network.mpkh;
    const {
      nonce,
      token
    } = this.decodedRecord.request;
    return utils.computeGatewayAddress({
      isTestnet,
      mpkh,
      g: {
        to: proxyAddress,
        p: [],
        tokenAddress: token,
        nonce
      }
    });
  }
  async repayLoan(utxo, darknodeSignature, overrides) {
    const pHash = KECCAK256_NULL;
    const vout = utxo.vout;
    const txhash = utxo.txHash;
    const record = this.decodedRecord;
    const contract = new ethers.Contract(this.proxyAddress, ShifterBorrowProxy.abi, new Web3Provider(this.zero.driver));
    return await contract.repayLoan(encodeTriggerParcel({
      record,
      pHash,
      vout,
      txhash
    }), overrides);
  }
  async defaultLoan(overrides) {
    const contract = new ethers.Contract(this.proxyAddress, ShifterBorrowProxy.abi, new Web3Provider(this.zero.driver));
    return await contract.defaultLoan(this.record, overrides);
  }
  async waitForConfirmations(num = 6) {
    let utxos;
    while (true) {
      utxos = await (this.zero.driver.sendWrapped('btc_getUTXOs', [{
        confirmations: num,
        address: this.depositAddress
      }]));
      if (utxos.length === 0) await new Promise((resolve) => setTimeout(resolve, UTXO_POLL_INTERVAL));
      else break;
    }
    return utxo;
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
  subscribeBorrows(filterArgs, callback) {
    const contract = new ethers.Contract(this.network.shifterPool, BorrowProxyLib.abi, new Web3Provider(this.driver));
    const filter = contract.filters.BorrowProxyMade(...filterArgs);
    contract.on(filter, (evt) => callback(new BorrowProxy(evt)));
    return () => contract.removeListener(filter);
  }
  async getBorrowProxies(borrower) {
    if (!borrower) {
      borrower = (await this.send('eth_accounts', []))[0];
    }
    const provider = new Web3Provider(this.driver);
    const contract = new ethers.Contract(this.network.shifterPool, BorrowProxyLib.abi, provider);
    const filter = contract.filters.BorrowProxyMade(...filterArgs);
    const logs = await provider.getLogs(Object.assign({
      fromBlock: this.network.genesis || 0
    }, filter));
    const decoded = logs.map((v) => contract.interface.events.BorrowProxyMade.decode(v));
    return decoded.map((v) => new ProxyRecord(v));
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
        value: toBase64(KECCAK256_NULL)
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
      gasRequested,
      signature
    }, ethersUtil.parseEther(bond), timeoutExpiry, overrides);
    return tx;
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

module.exports = Zero;
