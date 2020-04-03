'use strict';

const UTXO_POLL_INTERVAL = 5000;
const DARKNODE_QUERY_TX_INTERVAL = 5000;

const BN = require('bignumber.js');
const resultToJsonRpc = require('./util/result-to-jsonrpc');
const { Buffer } = require('safe-buffer');
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
const Web3ProviderEngine = require('web3-provider-engine');
const LiquidityToken = require('@0confirmation/sol/build/LiquidityToken');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const ShifterBorrowProxy = require('@0confirmation/sol/build/ShifterBorrowProxy');
const Exports = require('@0confirmation/sol/build/Exports');
const shifterPoolInterface = new ethers.utils.Interface(ShifterPool.abi);
const shifterBorrowProxyInterface = new ethers.utils.Interface(ShifterBorrowProxy.abi);

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
    borrowProxyCreationCode,
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
      borrowProxyCreationCode,
      borrowProxyLib,
      token,
      nonce,
      amount,
      gasRequested
    });
    this.signature = this.signature || signature;
    this.borrower = borrower || ethersUtil.verifyMessage(Buffer.from(utils.computeLiquidityRequestHash(this).substr(2), 'hex'), this.signature);
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
    borrowProxyCreationCode,
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
      borrowProxyCreationCode,
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
    borrowProxyCreationCode,
    decodedRecord,
    user,
    proxyAddress,
    record
  }) {
    this.zero = zero;
    this.shifterPool = shifterPool; 
    this.borrowProxyLib = borrowProxyLib;
    this.borrowProxyCreationCode = borrowProxyCreationCode;
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
    borrowProxyCreationCode,
    mpkh
  }) {
    this.options = {
      shifterPool,
      borrowProxyLib,
      borrowProxyCreationCode,
      mpkh
    };
    this.driver = new Driver(backends);
    const isTestnet = this.driver.getBackend('btc').testnet;
    this.network = {
      mpkh: mpkh || this.driver.backends.renvm.ren.network.contracts.renVM.mpkh,
      borrowProxyLib,
      borrowProxyCreationCode,
      shifterPool: shifterPool,
      isTestnet
    };
  }
  getProvider() {
    const wrappedEthProvider = getProvider(this.driver);
    const ethProvider = wrappedEthProvider.provider;
    const providerEngine = new Web3ProviderEngine();
    const sendAsync = (o, cb) => {
      resultToJsonRpc(o.id, async () => {
        console.log(o);
        switch (o.method) {
          case 'eth_accounts':
            return [ await this.driver.sendWrapped('0cf_getBorrowProxy', []) ];
          case 'eth_sign':
          case 'personal_sign':
          case 'eth_signTypedData':
            throw Error('borrow proxy cannot sign messages');
          case 'eth_sendTransaction':
          case 'eth_estimateGas':
          case 'eth_call':
            const [ payload ] = o.params;
            const [ from ] = await wrappedEthProvider.send('eth_accounts', []);
            const borrowProxy = await this.driver.sendWrapped('0cf_getBorrowProxy', []);
            console.log([ from, borrowProxy ]);
  const ln = (v) => ((console.log(v)), v);
            ln(payload);
            return await wrappedEthProvider.send(o.method, [ ln(Object.assign({
              from,
              to: borrowProxy,
              data: shifterBorrowProxyInterface.functions.proxy.encode([ payload.to, payload.value || '0x0', payload.data || '0x' ])
            }, payload.value && { value: payload.value } || {}, payload.gasPrice && { gasPrice: payload.gasPrice } || {}, payload.gas && { gas: payload.gas } || {}, payload.gasLimit && { gasLimit: payload.gasLimit } || {}, payload.nonce && { nonce: payload.nonce } || {})) ]);
          default:
            return await wrappedEthProvider.send(o.method, o.params);
        }
      }).then((response) => cb(null, response)).catch((err) => cb(err));
    };
    const send = (o, cb) => sendAsync(o, cb);
    return Object.assign(providerEngine, {
      send,
      sendAsync
    });
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
      borrowProxyCreationCode: this.network.borrowProxyCreationCode,
      token,
      amount,
      nonce,
      gasRequested
    });
  }
  subscribeBorrows(filterArgs, callback) {
    const contract = new Contract(this.network.shifterPool, BorrowProxyLib.abi, getProvider(this.driver).getSigner());
    const filter = contract.filters.BorrowProxyMade(...filterArgs);
    contract.on(filter, (user, proxyAddress, data) => callback(new BorrowProxy({
      zero: this,
      user,
      proxyAddress,
      record: data,
      shifterPool: this.network.shifterPool,
      borrowProxyCreationCode: this.network.borrowProxyCreationCode,
      borrowProxyLib: this.network.borrowProxyLib
    })));
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
      borrowProxyCreationCode: this.network.borrowProxyCreationCode,
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
        borrowProxyCreationCode: this.network.borrowProxyCreationCode,
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
    const contract = new Contract(token, LiquidityToken.abi, getProvider(this.driver).getSigner());
    return await contract.approve(liquidityToken.address, '0x' + Array(64).fill('f').join(''), overrides || {});
  }
  async addLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    return await liquidityToken.addLiquidity(value, overrides || {});
  }
  async removeLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    return await liquidityToken.removeLiquidityToken(value, overrides || {});
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
    const tx = await contract.executeBorrow({
      request: {
        borrower,
        token,
        nonce,
        amount
      },
      gasRequested,
      signature
    }, bond, timeoutExpiry, Object.assign(overrides || {}, {
      value: '0x' + new BN(gasRequested).toString(16)
    }));
    return tx;
  }
  async loadBorrowProxyCreationCode() {
    this.network.borrowProxyCreationCode = await (new Contract(this.network.shifterPool, ShifterPool.abi, getProvider(this.driver).getSigner())).getBorrowProxyCreationCode();
  }
  async initializeDriver() {
    await utils.initializeCodeHash();
    await this.driver.initialize();
  }
}

module.exports = Object.assign(Zero, {
  BorrowProxy,
  LiquidityRequestParcel,
  LiquidityRequest,
  DepositedLiquidityRequestParcel
});
