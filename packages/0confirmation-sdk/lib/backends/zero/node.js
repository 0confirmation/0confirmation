const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WebSocketStar = require('libp2p-websocket-star')
const WS = require('libp2p-websockets')
const Mplex = require('libp2p-mplex')
const SPDY = require('libp2p-spdy')
const SECIO = require('libp2p-secio')
const MulticastDNS = require('libp2p-mdns')
const defaultsDeep = require('@nodeutils/defaults-deep')
const Bootstrap = require('libp2p-bootstrap')
const KadDHT = require('libp2p-kad-dht')
const bluebird = require('bluebird');
const PeerInfo = bluebird.promisifyAll(require('peer-info'))
const multiaddr = require('multiaddr');
const { Buffer } = require('safe-buffer');

const toMulti = (multiAddrBase, peerId) => multiAddrBase + peerId;

const tryParse = (str) => {
  try {
    return JSON.parse(str);
  } catch(e) {
    return str;
  }
};

const tryStringify = data => typeof data == 'string' ? data : JSON.stringify(data)

const jsonBuffer = data => Buffer.from(tryStringify(data))

const tryParseJsonBuffer = data => Buffer.isBuffer(data) ? tryParse(data.toString('utf8')) : tryParse(data);

const defaultOptions = { 
  requestTimeout: 150000, 
  initialConnectTimeout: 100000,
  responseUrl: '/response',
  requestUrl: '/request',
  acceptRequests: false,
  waitForConnect: false,
  connectDelay: 500,
  nodeOptions: {
    dht: true
  }
}

const createNode = async (options) => {
  const peerInfo = await PeerInfo.createAsync(...(options.peerInfo ? [ options.peerInfo ] : []));
  return new Node(Object.assign({}, options, {
    peerInfo
  }));
};

class Node extends libp2p {
  constructor(options) {
    const wsstar = new WebSocketStar({ id: options.peerInfo.id });
    options = defaultsDeep(options, defaultOptions.nodeOptions);
    const defaults = {
      modules: {
        transport: [ TCP, WS, wsstar ],
        streamMuxer: [ Mplex, SPDY ],
        connEncryption: [ SECIO ],
        peerDiscovery: [
          wsstar.discovery,
          Bootstrap
        ],
        dht: options.dht ? KadDHT : undefined
      },
      config: {
        peerDiscovery: {
          mdns: {
            interval: 2000,
            enabled: true
          },
          bootstrap: {
            interval: 5000,
            enabled: false,
            list: []
          }
        },
        relay: {
          enabled: true,
          hop: {
            enabled: true,
            active: false
          }
        },
        dht: {
          enabled: options.dht,
          kBucketSize: 20
        },
        EXPERIMENTAL: {
          pubsub: true
        }
      }
    };

    super(Object.assign({}, defaults, {
      peerInfo: options.peerInfo
    }));
    Object.assign(this, {
      peerInfo: options.peerInfo,
      peerId: options.peerInfo.id.toB58String(),
      peers: {},
      pending: {},
      options: defaultsDeep(options, defaultOptions)
    });
    this.peerInfo.multiaddrs.add(options.multiaddr);
  }
  async initialize() {
    await super.start();
    let resolve, promise;
    promise = new Promise((_resolve) => {
      resolve = _resolve;
    });
    this.on('peer:connect', resolve);
    await super.start();
    await promise;
  }
  findPeer(peerId) {
    return new Promise((resolve, reject) => this.peerRouting.findPeer(peerId, (err, result) => err ? reject(err) : resolve(result)));
  }
  send(peer, protocol, data) {
    return new Promise((resolve, reject) => this.dialProtocol(peer.peerInfo, protocol, (err, conn) => {
      if (err) return reject(err)
      pull(pull.values([tryStringify(data)]), conn)
      resolve()
    }));
  }
  publish(event, data) {
    return this.pubsub.publish(event, jsonBuffer(data), () => {});
  }
  subscribe(event, fn) {
    return this.pubsub.subscribe(
      event,
      (msg) => {
        if (msg.from == this.peerId) return;
        fn({ ...msg, data: tryParse(msg.data) });
      },
      () => {}
    );
  }
}

Object.assign(module.exports, {
  Node,
  createNode
});
