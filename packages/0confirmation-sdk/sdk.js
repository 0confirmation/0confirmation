'use strict';

const staticPreprocessor = require('./static-preprocessor');
const ISafeViewExecutor = require('@0confirmation/sol/build/ISafeViewExecutor');
const pendingTransfersQuery = require('./queries/query-pending-transfers');
const genesisQuery = require('./queries/query-genesis');
const { makeEthersBase } = require('ethers-base');
const environment = require('./environments');
const constants = require('./constants');
const BN = require('bignumber.js');
const resultToJsonRpc = require('./util/result-to-jsonrpc');
const { AddressZero } = require('@ethersproject/constants');
const { Buffer } = require('safe-buffer');
const { RenVMType } = require('@renproject/interfaces');
const RenJS = require('./renvm');
const makeBaseProvider = require('@0confirmation/providers/base-provider');
const { toHex, toBase64 } = require('./util');
const { joinSignature } = require('@ethersproject/bytes');
const { keccak256 } = require('@ethersproject/solidity');
const { Contract, ContractFactory } = require('@ethersproject/contracts');
const utils = require('./util');
const { defaultAbiCoder: abi, Interface } = require('@ethersproject/abi');
const Driver = require('./driver');
const { getDefaultProvider, Web3Provider, JsonRpcProvider } = require('@ethersproject/providers');
const defaultProvider = getDefaultProvider();
const Web3ProviderEngine = require('web3-provider-engine');
const LiquidityToken = makeEthersBase(require('@0confirmation/sol/build/LiquidityToken'));
const LiquidityRequestParcel = require('./liquidity-request-parcel');
const LiquidityRequest = require('./liquidity-request');
const DepositedLiquidityRequestParcel = require('./deposited-liquidity-request-parcel');
const ShifterPoolArtifact = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const ShifterBorrowProxy = require('@0confirmation/sol/build/ShifterBorrowProxy');
const BorrowProxy = require('./borrow-proxy');
const ShifterPool = require('./shifter-pool');
const filterABI = (abi) => abi.filter((v) => v.type !== 'receive');
const shifterPoolInterface = new Interface(filterABI(ShifterPoolArtifact.abi));
const shifterBorrowProxyInterface = new Interface(filterABI(ShifterBorrowProxy.abi));
const uniq = require('lodash/uniq');

const getProvider = (zero) => {
  const provider = zero.getProvider();
  const ethersProvider = provider.asEthers();
  return ethersProvider.signer && ethersProvider.signer.provider || ethersProvider.provider;
};

const getSignatures = (abi) => {
  const iface = new Interface(filterABI(abi));
  return uniq(Object.keys(iface.functions).map((v) => iface.getSighash(v)));

};

const { timeout } = require('./util');

class Zero {
  async startHandlingKeeperDiscovery() {
    const backend = this.driver.getBackendByPrefix('0cf');
    await backend.startHandlingKeeperDiscovery();
  }
  async stopHandlingKeeperDiscovery() {
    const backend = this.driver.getBackendByPrefix('0cf');
    await backend.stopHandlingKeeperDiscovery();
  }
  async startHandlingBTCBlock() {
    const backend = this.driver.getBackendByPrefix('0cf');
    await backend.startHandlingBTCBlock();
  }
  async stopHandlingBTCBlock() {
    const backend = this.driver.getBackendByPrefix('0cf');
    await backend.stopHandlingBTCBlock();
  }
  createKeeperEmitter() {
    const backend = this.driver.getBackendByPrefix('0cf');
    return backend.createKeeperEmitter();
  }
  createBTCBlockEmitter() {
    const backend = this.driver.getBackendByPrefix('0cf');
    return backend.createBTCBlockEmitter();
  }
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
  setEnvironment(env) {
    this.network = env;
    this.network.shifterPool = this.network.shifterPool || AddressZero;
    this.shifterPool = new ShifterPool(this.network.shifterPool, this.getProvider().asEthers(), this);
  }
  constructor(o, ...args) {
    if (o.send || o.sendAsync) {
      if (args.length && args[0]) {
        if (args[0] === 'mock') o = environment.getMockEnvironment(o);
        else o = environment.getEnvironment(o, ...args);
      }
    }
    const {
      backends,
      shifterPool,
      borrowProxyLib,
      borrowProxyCreationCode,
      mpkh
    } = o;
    this.options = {
      shifterPool,
      borrowProxyLib,
      borrowProxyCreationCode,
      mpkh
    };
    this.driver = new Driver(backends);
    const isTestnet = this.driver.getBackend('btc').testnet;
    this.setEnvironment({
      mpkh: mpkh,
      borrowProxyLib,
      borrowProxyCreationCode,
      shifterPool: shifterPool,
      isTestnet
    });
  }
  async setBorrowProxy(address) {
    return await this.driver.sendWrapped('0cf_setBorrowProxy', [ address ]);
  }
  getSigner() {
    const backend = this.driver.getBackend('ethereum');
    return backend.provider._ethers;
  }
  getProvider() {
    const eth = this.driver.getBackend('ethereum');
    const provider = eth.provider;
    provider.asEthers = () => {
      const ethersObject = provider._ethers
      let internalEthers = ethersObject._ethers;
      if (internalEthers) {
        if (internalEthers.provider && internalEthers.provider.listAccounts) internalEthers = internalEthers.provider;
      } else internalEthers = new Web3Provider(provider);
      return internalEthers;
    };
    return provider;
  }
  getBorrowProvider() {
    const wrappedEthProvider = this.getProvider(this.driver);
    const ethProvider = wrappedEthProvider.provider;
    const providerEngine = new Web3ProviderEngine();
    const sendAsync = (o, cb) => {
      resultToJsonRpc(o.id, async () => {
        switch (o.method) {
          case 'eth_accounts':
            return [ await this.driver.sendWrapped('0cf_getBorrowProxy', []) ];
          case 'eth_sign':
          case 'personal_sign':
          case 'eth_signTypedData':
            throw Error('borrow proxy cannot sign messages');
          case 'eth_sendTransaction':
          case 'eth_estimateGas':
            const [ payload ] = o.params;
            const [ from ] = await wrappedEthProvider.send('eth_accounts', []);
            const borrowProxy = await this.driver.sendWrapped('0cf_getBorrowProxy', []);
            return await wrappedEthProvider.send(o.method, [ Object.assign({
              from,
              to: borrowProxy,
              data: shifterBorrowProxyInterface.functions.proxy.encode([ payload.to, payload.value || '0x0', payload.data || '0x' ])
            }, payload.value && { value: payload.value } || {}, payload.gasPrice && { gasPrice: payload.gasPrice } || {}, payload.gas && { gas: payload.gas } || {}, payload.gasLimit && { gasLimit: payload.gasLimit } || {}, payload.nonce && { nonce: payload.nonce } || {}) ]);
          case 'eth_call':
            const [ callPayload ] = o.params;
            const callBorrowProxy = await this.driver.sendWrapped('0cf_getBorrowProxy', []);
            return await wrappedEthProvider.send(o.method, [ Object.assign({
              from: callBorrowProxy,
              data: callPayload.data
            }, callPayload.to && { to: callPayload.to } || {}, callPayload.value && { value: callPayload.value } || {}, callPayload.gasPrice && { gasPrice: callPayload.gasPrice } || {}, callPayload.gas && { gas: callPayload.gas } || {}, callPayload.gasLimit && { gasLimit: callPayload.gasLimit } || {}, callPayload.nonce && { nonce: callPayload.nonce } || {}) ]);
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
    borrower,
    forbidLoan,
    gasRequested,
    actions
  }) {
    return new LiquidityRequest({
      zero: this,
      shifterPool: this.network.shifterPool,
      borrowProxyLib: this.network.borrowProxyLib,
      borrowProxyCreationCode: this.network.borrowProxyCreationCode,
      actions: actions || [],
      token,
      amount,
      nonce,
      borrower,
      forbidLoan: false,
      gasRequested
    });
  }
  subscribeBorrows(filterArgs, callback) {
    const contract = this.shifterPool;
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
  async getAddress() {
    const signerOrProvider = this.getProvider().asEthers();
    if (signerOrProvider.getAddress) return await signerOrProvider.getAddress();
    const accounts = await signerOrProvider.listAccounts();
    return accounts[0] || (() => {
      throw Error('must have an account active on provider');
    })();
  }
  async getBorrowProxies(borrower) {
    if (!borrower) {
      borrower = await this.getAddress();
    }
    const provider = getProvider(this);
    const contract = this.shifterPool;
    const filter = contract.filters.BorrowProxyMade(...[ borrower ]);
    const logs = await provider.getLogs(Object.assign({
      fromBlock: await this.shifterPool.getGenesis() 
    }, filter));
    const decoded = logs.map((v) => contract.interface.parseLog(v).args);
    return decoded.map((v, i) => new BorrowProxy(Object.assign({
      zero: this,
      shifterPool: this.network.shifterPool,
      borrowProxyCreationCode: this.network.borrowProxyCreationCode,
      borrowProxyLib: this.network.borrowProxyLib,
      transactionHash: logs[i].transactionHash,
    }, v)));
  } 
  async broadcastLiquidityRequest({
    from,
    token,
    amount,
    nonce,
    actions,
    forbidLoan,
    gasRequested
  }) {
    const liquidityRequest = this.createLiquidityRequest({
      token,
      amount,
      nonce,
      forbidLoan,
      actions: actions || [],
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
            abi: constants.CONST_P_ABI_B64,
            value: constants.CONST_P_VALUE_B32,
            fn: constants.CONST_P_FN_B64
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
        actions,
        forbidLoan,
        gasRequested,
        signature
      }] = msg.data.params;
      if (shifterPool !== this.network.shifterPool) return;
      callback(new LiquidityRequestParcel({
        zero: this,
        borrowProxyLib: this.network.borrowProxyLib,
        borrowProxyCreationCode: this.network.borrowProxyCreationCode,
        shifterPool,
        actions,
        token,
        forbidLoan,
        nonce,
        amount,
        gasRequested,
        signature
      }));
    });
  }
  async stopListeningForLiquidityRequests() {
    return await (this.driver.getBackend('zero'))._unsubscribeLiquidityRequests();
  }
  async approvePool(token, overrides) {
    const contract = new LiquidityToken(token, this.getSigner());
    return await contract.approve(this.network.shifterPool, '0x' + Array(64).fill('f').join(''), overrides || {});
  }
  async getLiquidityTokenFor(token) {
    const contract = this.shifterPool;
    const liquidityToken = new LiquidityToken(await contract.getLiquidityTokenHandler(token), this.getSigner());
    return liquidityToken;
  }
  async approveLiquidityToken(token, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    const contract = new LiquidityToken(token, this.getSigner());
    return await contract.approve(liquidityToken.address, '0x' + Array(62).fill('f').join(''), overrides || {});
  }
  async addLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    return await liquidityToken.addLiquidity(value, overrides || {});
  }
  async removeLiquidity(token, value, overrides) {
    const liquidityToken = await this.getLiquidityTokenFor(token);
    return await liquidityToken.removeLiquidity(value, overrides || {});
  }
  async executeBorrow(liquidityRequest, bond, timeoutExpiry, overrides) {
    const { 
      shifterPool,
      token,
      nonce,
      amount,
      gasRequested,
      signature,
      actions,
      forbidLoan,
      borrower
    } = liquidityRequest;
    const contract = this.shifterPool;
    const tx = await contract.executeBorrow({
      request: {
        borrower,
        token,
        nonce,
        amount,
        forbidLoan,
        actions: (actions || []).map((v) => ({
          to: v.to,
          txData: v.calldata
        })),
      },
      gasRequested,
      signature
    }, bond, timeoutExpiry, Object.assign(overrides || {}, {
      value: '0x' + new BN(gasRequested).toString(16)
    }));
    return tx;
  }
  async loadBorrowProxyCreationCode() {
    this.network.borrowProxyCreationCode = await (new Contract(this.network.shifterPool, filterABI(ShifterPool.abi), this.getProvider(this.driver).getSigner())).getBorrowProxyCreationCode();
  }
  async initializeDriver() {
    await this.driver.initialize();
  }
}

const preprocessor = (artifact, ...args) => {
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, (new JsonRpcProvider('http://localhost:8545')).getSigner());
  const { data } = factory.getDeployTransaction(...args);
  return {
    to: AddressZero,
    calldata: data
  };
};

class ZeroMock extends Zero {
  connectMock(otherZero) {
    const zeroBackend = this.driver.getBackend('zero');
    const otherZeroBackend = otherZero.driver.getBackend('zero');
    zeroBackend.connectMock(otherZeroBackend);
  }
  constructor(provider) {
    super(provider, 'mock');
  }
}

module.exports = Object.assign(Zero, {
  ZeroMock,
  BorrowProxy,
  preprocessor,
  staticPreprocessor,
  getSignatures,
  LiquidityRequestParcel,
  LiquidityRequest,
  DepositedLiquidityRequestParcel
}, utils);
