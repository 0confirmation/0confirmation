'use strict';

const UTXO_POLL_INTERVAL = 5000;
const DARKNODE_QUERY_TX_INTERVAL = 5000;

const networks = require('./networks');
const { RenVMType } = require('@renproject/ren-js-common');
const { NULL_PHASH, toHex, toBase64 } = require('./util');
const RenJS = require('@renproject/ren');
const ethersUtil = require('ethers/utils');
const { joinSignature, solidityKeccak256 } = ethersUtil;
const ethers = require('ethers');
const defaultProvider = ethers.getDefaultProvider();
const { Contract } = require('ethers/contract');
const utils = require('./util');
const abi = ethersUtil.defaultAbiCoder;
const Driver = require('./driver');
const { Web3Provider } = require('ethers/providers/web3-provider');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const Exports = require('@0confirmation/sol/build/Exports');

const BYTES_TYPES = [ 'bytes' ];

const ProxyRecordABI = Exports.abi.find((v) => v.name === 'ProxyRecordExport').inputs[0];
const TriggerParcelABI = Exports.abi.find((v) => v.name === 'TriggerParcelExport').inputs[0];

const decodeProxyRecord = (input) => abi.decode([ ProxyRecordABI ], input)[0];
const encodeTriggerParcel = (input) => abi.encode([ TriggerParcelABI ], [ input ]);

const timeout = (n) => new Promise((resolve) => setTimeout(resolve, n));

const DummyABI = {
  name: 'dummy',
  constant: false,
  inputs: [],
  outputs: [],
  payable: true,
  stateMutability: 'payable',
  type: 'function'
};

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

const pAbi = {
  name: 'shiftIn',
  type: 'function',
  constant: false,
  inputs: [{
    type: 'address',
    name: '_shifterRegistry',
    value: NULL_ADDRESS
  }, {
    type: 'string',
    name: '_symbol',
    value: ''
  }, {
    type: 'address',
    name: '_address',
    value: NULL_ADDRESS
  }]
};

const pAbiValue = abi.encode(pAbi.inputs.map((v) => v.type), [ NULL_ADDRESS, '', NULL_ADDRESS ]);

const pAbiValueB32 = toBase64(pAbiValue);

const CONST_PHASH = solidityKeccak256(['bytes'], [ pAbiValue ]);

const pAbiExpanded = Object.assign({}, pAbi, {
  inputs: [{
    name: "_amount",
    type: "uint256"
  }, {
    name: "_nHash",
    type: "bytes32"
  }, {
    name: "_sig",
    type: "bytes"
  }]
});

class LiquidityRequest {
  constructor({
    zero,
    shifterPool,
    borrowProxyLib,
    token,
    nonce,
    amount,
    gasRequested
  }) {
    Object.assign(this, {
      shifterPool,
      borrowProxyLib,
      token,
      nonce,
      amount,
      zero,
      gasRequested
    });
  }
  async sign(from) {
    const signature = await this.zero.driver.sendWrapped('personal_sign', [ utils.computeLiquidityRequestHash({
      shifterPool: this.shifterPool,
      borrowProxyLib: this.borrowProxyLib,
      token: this.token,
      nonce: this.nonce,
      amount: this.amount,
      gasRequested: this.gasRequested
    }), from || (await this.zero.driver.sendWrapped('eth_accounts', []))[0] ]);
    return new LiquidityRequestParcel(Object.assign({
      signature
    }, this));
  }
}

class LiquidityRequestParcel extends LiquidityRequest {
  constructor({
    zero,
    borrowProxyLib,
    shifterPool,
    token,
    nonce,
    amount,
    gasRequested,
    borrower,
    proxyAddress,
    depositAddress,
    signature
  }) {
    super({
      zero,
      shifterPool,
      borrowProxyLib,
      token,
      nonce,
      amount,
      gasRequested
    });
    this.signature = this.signature || signature;
    this.borrower = borrower || ethersUtil.verifyMessage(utils.computeLiquidityRequestHash(this), this.signature)
    this.proxyAddress = proxyAddress || utils.computeBorrowProxyAddress(this);
    this.depositAddress = depositAddress || utils.computeGatewayAddress({
      isTestnet: this.zero.network.isTestnet,
      mpkh: this.zero.network.mpkh,
      g: {
        to: this.proxyAddress,
        p: CONST_PHASH,
        tokenAddress: this.token,
        nonce: this.nonce
      }
    });
  }
  getBroadcastMessage() {
    return {
      shifterPool: this.shifterPool,
      token: this.token,
      nonce: this.nonce,
      amount: this.amount,
      gasRequested: this.gasRequested,
      signature: this.signature
    };
  }
  async broadcast() {
    return await this.zero.driver.sendWrapped('0cf_broadcastLiquidityRequest', [ this.getBroadcastMessage() ]);
  }
  async executeBorrow(bond, timeoutExpiry, overrides) {
    return await this.zero.executeBorrow(this, bond, timeoutExpiry, overrides || {});
  }
  async waitForDeposit(confirmations = 0) {
    let utxos;
    while (true) {
      utxos = await (this.zero.driver.sendWrapped('btc_getUTXOs', [{
        confirmations,
        address: this.depositAddress
      }]));
      if (utxos.length === 0) await timeout(UTXO_POLL_INTERVAL);
      else break;
    }
    return new DepositedLiquidityRequestParcel(Object.assign({
      utxo: {
        vOut: utxos[0].output_no,
        txHash: '0x' + utxos[0].txid
      }
    }, this));
  }
}

class DepositedLiquidityRequestParcel extends LiquidityRequestParcel {
  constructor({
    zero,
    shifterPool,
    borrowProxyLib,
    token,
    nonce,
    amount,
    gasRequested,
    borrower,
    proxyAddress,
    depositAddress,
    signature,
    utxo
  }) {
    super({
      zero,
      shifterPool,
      borrowProxyLib,
      token,
      nonce,
      amount,
      gasRequested,
      borrower,
      proxyAddress,
      depositAddress,
      signature
    });
    this.utxo = utxo;
  }
  async queryTx() {
    return await this.zero.driver.sendWrapped('ren_queryTx', {
      txHash: this.computeShiftInTxHash()
    });
  }
  async waitForSignature() {
    while (true) {
      const result = await this.queryTx();
      if (result && result.tx && result.tx.out) {
        const {
          tx: {
            out: [{
              value: r
            }, {
              value: s
            }, {
              value: v
            }]
          }
        } = result;
        return joinSignature({
          v: Number(v) + 27,
          r: toHex(r),
          s: toHex(s)
        });
      } else await timeout(DARKNODE_QUERY_TX_INTERVAL);
    }
  }
  computeShiftInTxHash() {
    return utils.computeShiftInTxHash({
      renContract: RenJS.Tokens.BTC.Mint,
      g: {
        to: this.proxyAddress,
        p: CONST_PHASH,
        tokenAddress: this.token,
        nonce: this.nonce
      },
      utxo: this.utxo
    });
  }
  async submitToRenVM() {
    return await this.zero.submitToRenVM({
      token: this.token,
      amount: this.amount,
      nonce: this.nonce,
      to: this.proxyAddress,
      utxo: this.utxo
    });
  }
}

const getProvider = (driver) => new Web3Provider(driver.getBackend('ethereum').provider);

class BorrowProxy {
  constructor ({
    zero,
    shifterPool,
    borrowProxyLib,
    user,
    proxyAddress,
    record
  }) {
    this.zero = zero;
    this.shifterPool = shifterPool; 
    this.borrowProxyLib = borrowProxyLib;
    this.borrower = user;
    this.proxyAddress = proxyAddress;
    this.record = record;
    this.decodedRecord = decodedRecord || decodeProxyRecord(record);
    Object.assign(this, this.decodedRecord.request);
  }
  getLiquidityRequestParcel() {
    return new LiquidityRequestParcel(this);
  }
  getDepositAddress() {
    return this.getLiquidityRequestParcel().depositAddress;
  }
  async waitForConfirmed() {
    const deposited = await (this.getLiquidityRequestParcel()).waitForDeposit();
    return await deposited.waitForSignature();
  }
  async repayLoan(overrides) {
    const deposited = await (this.getLiquidityRequestParcel()).waitForDeposit();
    const darknodeSignature = await deposited.waitForSignature();
    const { vOut, txHash } = utxo;
    const record = this.decodedRecord;
    const contract = new Contract(this.proxyAddress, ShifterBorrowProxy.abi, getProvider(this.zero.driver).getSigner());
    return await contract.repayLoan(encodeTriggerParcel({
      record,
      pHash: CONST_PHASH,
      vout: vOut,
      txhash: txHash,
      darknodeSignature
    }), overrides || {});
  }
  async defaultLoan(overrides) {
    const contract = new Contract(this.proxyAddress, ShifterBorrowProxy.abi, getProvider(this.zero.driver).getSigner());
    return await contract.defaultLoan(this.record, overrides || {});
  }
  async waitForConfirmations(num = 6) {
    let utxos;
    while (true) {
      utxos = await (this.zero.driver.sendWrapped('btc_getUTXOs', [{
        confirmations: num,
        address: this.getDepositAddress()
      }]));
      if (utxos.length === 0) await timeout(UTXO_POLL_INTERVAL);
      else break;
    }
    const utxo = utxos[0];
    return {
      vOut: utxo.output_no,
      txHash: '0x' + utxo.txid
    };
  }
}

class Zero {
  static async fromProvider(ethProvider, presetName = 'default') {
    const provider = new Web3Provider(ethProvider);
    const chainId = Number(await provider.send('eth_chainId', []));
    const network = networks[chainId][presetName];
    return new Zero(Object.assign({
      backends: Object.assign({}, network, {
        provider: ethProvider
      })
    }, networks.contracts));
  }
  constructor({
    backends,
    shifterPool,
    borrowProxyLib,
    mpkh
  }) {
    this.options = {
      shifterPool,
      borrowProxyLib,
      mpkh
    };
    this.driver = new Driver(backends);
    const isTestnet = this.driver.getBackend('btc').testnet;
    this.network = {
      mpkh: mpkh || this.driver.backends.renvm.ren.network.contracts.renVM.mpkh,
      borrowProxyLib,
      shifterPool: shifterPool,
      isTestnet
    };
  }
  createLiquidityRequest({
    token,
    amount,
    nonce,
    gasRequested
  }) {
    return new LiquidityRequest({
      zero: this,
      shifterPool: this.network.shifterPool,
      borrowProxyLib: this.network.borrowProxyLib,
      token,
      amount,
      nonce,
      gasRequested
    });
  }
  subscribeBorrows(filterArgs, callback) {
    const contract = new Contract(this.network.shifterPool, BorrowProxyLib.abi, getProvider(this.driver).getSigner());
    const filter = contract.filters.BorrowProxyMade(...filterArgs);
    contract.on(filter, (evt) => callback(new BorrowProxy(evt)));
    return () => contract.removeListener(filter);
  }
  async getBorrowProxies(borrower) {
    if (!borrower) {
      borrower = (await this.send('eth_accounts', []))[0];
    }
    const provider = getProvider(this.driver);
    const contract = new Contract(this.network.shifterPool, BorrowProxyLib.abi, provider.getSigner());
    const filter = contract.filters.BorrowProxyMade(...filterArgs);
    const logs = await provider.getLogs(Object.assign({
      fromBlock: this.network.genesis || 0
    }, filter));
    const decoded = logs.map((v) => contract.interface.events.BorrowProxyMade.decode(v));
    return decoded.map((v) => new BorrowProxy(Object.assign({
      zero: this,
      shifterPool: this.network.shifterPool,
      borrowProxyLib: this.network.borrowProxyLib
    }, v)));
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
      gasRequested
    });
    const parcel = await liquidityRequest.sign(from);
    await parcel.broadcast();
    return parcel;
  }
  async submitToRenVM({
    token,
    amount,
    to,
    nonce,
    utxo
  }) {
    return await this.driver.sendWrapped('ren_submitTx', {
      tx: {
        to: RenJS.Tokens.BTC.Mint,
        in: [{
          name: 'p',
          type: RenVMType.ExtEthCompatPayload,
          value: {
            abi: toBase64(Buffer.from(JSON.stringify([ pAbiExpanded ])).toString('hex')),
            value: pAbiValueB32,
            fn: toBase64(Buffer.from('shiftIn').toString('hex'))
          }
        }, {
          name: 'token',
          type: RenVMType.ExtTypeEthCompatAddress,
          value: utils.stripHexPrefix(token)
        }, {
          name: 'to',
          type: RenVMType.ExtTypeEthCompatAddress,
          value: utils.stripHexPrefix(to)
        }, {
          name: 'n',
          type: RenVMType.TypeB32,
          value: toBase64(nonce)
        }, {
          name: 'utxo',
          type: RenVMType.ExtTypeBtcCompatUTXO,
          value: {
            vOut: String(utxo.vOut),
            txHash: String(toBase64(utxo.txHash))
          }
        }]
      }
    });
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
        borrowProxyLib: this.network.borrowProxyLib,
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
    const contract = new Contract(token, LiquidityToken.abi, getProvider(this.driver).getSigner());
    return await contract.approve(this.network.shifterPool, '0x' + Array(64).fill('f').join(''), overrides || {});
  }
  async getLiquidityTokenFor(token) {
    const contract = new Contract(this.network.shifterPool, ShifterPool.abi, getProvider(this.driver).getSigner());
    const liquidityToken = new Contract(await contract.getLiquidityTokenHandler(token), LiquidityToken.abi, getProvider(this.driver).getSigner());
    return liquidityToken;
  }
  async approveLiquidityToken(token, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    console.log(liquidityToken.address);
    const contract = new Contract(token, LiquidityToken.abi, getProvider(this.driver).getSigner());
    return await contract.approve(liquidityToken.address, '0x0' + Array(63).fill('f').join(''), overrides || {});
  }
  async addLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    console.log(liquidityToken.address);
    await liquidityToken.addLiquidity(ethersUtil.parseEther(value), overrides || {});
  }
  async removeLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    await liquidityToken.removeLiquidityToken(ethersUtil.parseEther(value), overrides || {});
  }
  async executeBorrow(liquidityRequest, bond, timeoutExpiry, overrides) {
    const { 
      shifterPool,
      token,
      nonce,
      amount,
      gasRequested,
      signature,
      borrower
    } = liquidityRequest;
    const contract = new Contract(this.network.shifterPool, ShifterPool.abi, getProvider(this.driver).getSigner());
    await contract.executeBorrow({
      request: {
        borrower,
        token,
        nonce,
        amount
      },
      gasRequested,
      signature
    }, ethersUtil.parseEther(bond), timeoutExpiry, Object.assign(overrides || {}, {
      value: gasRequested,
      gas: '0x' + (6e6).toString(16)
    }));
    return tx;
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

module.exports = Object.assign(Zero, {
  BorrowProxy,
  LiquidityRequestParcel,
  LiquidityRequest,
  DepositedLiquidityRequestParcel
});
