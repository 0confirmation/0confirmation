'use strict';

const { createNode } = require('@0confirmation/p2p');
const { RPCWrapper, resultToJsonRpc } = require('../../util');
const EventEmitter = require('events');
const url = require('url');
const axios = require('axios');
const pipe = require('it-pipe');
const PeerId = require('peer-id');
const PeerInfo = require('peer-info');

const { Buffer } = require('buffer');

const DISCOVER_INTERVAL = 30000;
const BTC_BLOCK_INTERVAL = 30000;
const BLOCKCYPHER_HOSTNAME = 'api.blockcypher.com';
const BLOCKCYPHER_PROTOCOL = 'https:';

const BLOCKCYPHER_MAIN_PATHNAME = '/v1/btc/main';

const getLatestBlockReq = async () => await axios({
  url: url.format({
    protocol: BLOCKCYPHER_PROTOCOL,
    hostname: BLOCKCYPHER_HOSTNAME,
    pathname: BLOCKCYPHER_MAIN_PATHNAME
  }),
  method: 'GET'
});

const getLatestBlock = async () => {
  const response = await getLatestBlockReq();
  return Number(response.data.height);
};

const fromB58 = async (socket, from) => {
  const peerId = PeerId.createFromB58String(from);
  const peerInfo = await socket.peerRouting.findPeer(peerId);
  return peerInfo;
};

class KeeperEmitter extends EventEmitter {
  constructor(socket) {
    super();
    this.discoverInterval = DISCOVER_INTERVAL;
    this.socket = socket;
    this.socket.handle('/respondDiscoverKeepers/1.0.0', async ({ stream }) => {
      await pipe(stream, async (source) => {
        for await (const msg of source) {
          try {
            this.emit('keeper', JSON.parse(msg.toString()).address);
          } catch (e) {
            console.error(e.stack);
          } 
        }
      });
    });
  }
  poll() {
    this.socket.pubsub.publish('/discoverKeepers/1.0.0', Buffer.from(JSON.stringify({})));
  }
  subscribe() {
    this.unsubscribe();
    this.poll();
    this.interval = setInterval(() => this.poll(), this.discoverInterval);
    return this;
  }
  unsubscribe() {
    if (this.interval) clearInterval(this.interval);
  }
  static create(socket) {
    return new this(socket);
  }
}

class BTCBlockEmitter extends EventEmitter {
  constructor(socket) {
    super();
    this.discoverInterval = BTC_BLOCK_INTERVAL;
    this.socket = socket;
    this.socket.handle('/respondBtcBlock/1.0.0', async ({ stream }) => {
      await pipe(stream, async (source) => {
        for await (const msg of source) {
          try {
            this.emit('block', JSON.parse(msg.toString()).blockNumber);
          } catch (e) {
            console.error(e.stack);
          } 
        }
      });
    });
  }
  poll() {
    this.socket.pubsub.publish('/btcBlock/1.0.0', Buffer.from(JSON.stringify({})));
  }
  subscribe() {
    this.unsubscribe();
    this.poll();
    this.interval = setInterval(() => this.poll(), this.discoverInterval);
    return this;
  }
  unsubscribe() {
    if (this.interval) clearInterval(this.interval);
  }
  static create(socket) {
    return new this(socket);
  }
}

class ZeroBackend extends RPCWrapper {
  constructor({
    driver,
    multiaddr,
    dht,
    peerInfo = null
  }) {
    super();
    this.name = 'zero';
    this.prefixes = ['0cf'];
    this.driver = driver;
    this.multiaddr = multiaddr;
    this.peerInfo = peerInfo;
    this.dht = dht;
    this._filters = {};
  }
  async initialize() {
    this.node = await createNode({
      peerInfo: this.peerInfo,
      dht: this.dht,
      multiaddr: this.multiaddr
    });
    await this.node.start();
  }
  async subscribe() {
    this.keeperEmitter = this.createKeeperEmitter();
    this.btcBlockEmitter = this.createBTCBlockEmitter();
    await this.keeperEmitter.subscribe();
    await this.btcBlockEmitter.subscribe();
  }
  async stop() {
    await this.node.stop();
  }
  async _filterLiquidityRequests(handler) {
     return await this.node.subscribe('/broadcastLiquidityRequest/1.0.0', handler);
  }
  async _unsubscribeLiquidityRequests() {
     return await this.node.unsubscribe('/broadcastLiquidityRequest/1.0.0');
  }
  _tryParse(data) {
    try {
      return JSON.parse(data.toString('utf8'));
    } catch (e) {
      return data;
    }
  }
  createKeeperEmitter() {
    return this.keeperEmitter || KeeperEmitter.create(this.node.socket);
  }
  createBTCBlockEmitter() {
    return this.btcBlockEmitter || BTCBlockEmitter.create(this.node.socket);
  }
  async startHandlingKeeperDiscovery() {
      const [ address ] = await (this.driver.getBackendByPrefix('eth')).sendWrapped('eth_accounts', []);
      await this.node.socket.pubsub.subscribe('/discoverKeepers/1.0.0', async (msg) => {
        const peerInfo = await fromB58(this.node.socket, msg.from); 
        const { stream } = await this.node.socket.dialProtocol(peerInfo, '/respondDiscoverKeepers/1.0.0');
        await pipe([JSON.stringify({
          address
        })], stream);
      });
      this.node.socket.on('peer:discovery', (peerInfo) => {
        (async () => {
          const { stream } = await this.node.socket.dialProtocol(peerInfo, '/respondDiscoverKeepers/1.0.0');
          await pipe([JSON.stringify({
            address
          })], stream);
        })().catch((err) => console.error(err));
    });
  }
  async _getAndSetBTCBlock() {
    let btcBlock = await getLatestBlock();
    if (isNaN(btcBlock)) btcBlock = this._btcBlock || 0;
    this._btcBlock = btcBlock;
    return btcBlock;
  }
  async startHandlingBTCBlock() {
      await this._getAndSetBTCBlock().catch((err) => {
        console.error(err);
        this._btcBlock = 0;
      });
      this._btcBlockInterval = setInterval(() => {
        (async () => {
          await this._getAndSetBTCBlock();
        })().catch((err) => console.error(err));
      }, BTC_BLOCK_INTERVAL);
      await this.node.socket.pubsub.subscribe('/btcBlock/1.0.0', async (msg) => {
        const peerInfo = await fromB58(this.node.socket, msg.from); 
        const { stream } = await this.node.socket.dialProtocol(peerInfo, '/respondBtcBlock/1.0.0');
        const [ address ] = await (this.driver.getBackendByPrefix('eth')).sendWrapped('eth_accounts', []);
        await pipe([JSON.stringify({
          blockNumber: this._btcBlock
        })], stream);
      });
  }
  async stopHandlingKeeperDiscovery() {
    await this.node.socket.pubsub.unsubscribe('/discoverKeepers/1.0.0');
  }
  async stopHandlingBTCBlock() {
    if (this._btcBlockInterval) {
      clearInterval(this._btcBlockInterval);
      this._btcBlockInterval = null;
    }
    await this.node.socket.pubsub.unsubscribe('/btcBlock/1.0.0');
  }
  _nextFilterId(o) {
    return '0x' + (o._filterId = (o._filterId !== undefined ? o._filterId : -1) + 1).toString(16);
  }
  send(o, cb) {
    this.sendPromise(o).then((result) => cb(null, result)).catch((err) => cb(err));
  }
  async sendPromise({
    id,
    method,
    params
  }) {
    switch (method) {
      case '0cf_peerId':
        return await resultToJsonRpc(id, () => this.node.socket.peerInfo.id.toB58String());
      case '0cf_setBorrowProxy':
        return await resultToJsonRpc(id, () => {
          return this._borrowProxy = params[0];
        });
      case '0cf_getBorrowProxy':
        return await resultToJsonRpc(id, async () => {
          if (!this._borrowProxy) throw Error('no borrow proxy selected');
          return this._borrowProxy;
        });
      case '0cf_broadcastLiquidityRequest':
        const [{
          shifterPool,
          token,
          amount,
          nonce,
          actions,
          forbidLoan,
          gasRequested,
          signature
        } = {}] = (params || []);
        await this.node.publish('/broadcastLiquidityRequest/1.0.0', {
          id,
          params: [{
            shifterPool,
            token,
            amount,
            actions,
            forbidLoan,
            nonce,
            gasRequested,
            signature
          }]
        });
        return await resultToJsonRpc(id, () => 1);
      case '0cf_filterLiquidityRequests':
        const filterId = this._nextFilterId(this);
        this._filters[filterId] = this._filters[filterId] || [];
        this._filterLiquidityRequests((msg) => {
          this._filters[filterId] = this._filters[filterId] || [];
          this._filters[filterId].push(msg);
        });
        return await resultToJsonRpc(id, () => filterId);
      case '0cf_getFilterUpdates':
        const [ getFilterUpdatesId ] = params;
        const result = this._filters[getFilterUpdatesId];
        if (!result) return await resultToJsonRpc(id, () => []);
        this._filters[getFilterUpdatesId] = [];
        return await resultToJsonRpc(id, () => result);
    }
  }
}

module.exports = ZeroBackend;
