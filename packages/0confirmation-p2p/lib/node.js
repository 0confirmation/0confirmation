'use strict';

const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WebsocketStar = require('libp2p-websocket-star')
const WS = require('libp2p-websockets')
const Mplex = require('libp2p-mplex')
const SPDY = require('libp2p-spdy')
const SECIO = require('libp2p-secio')
const MulticastDNS = require('libp2p-mdns')
const Bootstrap = require('libp2p-bootstrap')
const KadDHT = require('libp2p-kad-dht')
const bluebird = require('bluebird');
const PeerInfo = require('peer-info');
const GossipSub = require('libp2p-gossipsub');
const EventEmitter = require('events').EventEmitter;
const wrtc = require('wrtc');

const returnOp = (v) => v;

class CustomWebsocketStar extends WebsocketStar {
  constructor(...args) {
    super(...args);
    const { discovery } = this;
    const [ start, stop ] = [ discovery.start, discovery.stop ].map((v) => bluebird.promisify(v, { context: discovery }));
    Object.assign(discovery, {
      start,
      stop
    });
  }
  createListener(...args) {
    const listener = super.createListener(...args);
    const { listen } = listener;
    return Object.assign(listener, {
      getAddrs: () => listener.ma ? [ listener.ma ] : [],
      listen: bluebird.promisify(listen, { context: listener }),
    });
  }
}

const createBoundWebsocketStar = (Class, options) => {
  const tag = Class.prototype[Symbol.toStringTag];
  const instance = new Class(options);
  const discovery = instance.discovery;
  class BoundWebsocketStar {
    constructor() {
      return instance;
    }
  }
  class BoundWebsocketDiscovery {
    constructor() {
      return discovery;
    }
  }
  Object.setPrototypeOf(BoundWebsocketStar.prototype, Class.prototype);
  Object.setPrototypeOf(BoundWebsocketDiscovery.prototype, EventEmitter.prototype);
  return {
    tag,
    discoveryTag: 'websocketStar',
    BoundWebsocketStar,
    options,
    BoundWebsocketDiscovery,
    wsstar: instance,
    discovery
  };
};

const { jsonBuffer, tryParse, tryStringify } = require('./util');

const WStar = require('libp2p-webrtc-star');

const createNode = async (options) => {
  const peerInfo = options.peerInfo || await PeerInfo.create();
  peerInfo.multiaddrs.add(options.multiaddr);
  const dhtEnable = typeof options.dht === 'undefined' || options.dht === true;
  const wstar = new WStar({
    upgrader: {
      localPeer: peerInfo.id,
      upgradeInbound: returnOp,
      upgradeOutbound: returnOp
    },
    wrtc
  });
  class BoundStar {
    constructor() {
      return wstar;
    }
  }
  BoundStar.prototype[Symbol.toStringTag] = WStar.prototype[Symbol.toStringTag];
  const socket = await libp2p.create({
    peerInfo,
    modules: {
      transport: [ TCP, WS, BoundStar ],
      streamMuxer: [ Mplex, SPDY ],
      connEncryption: [ SECIO ],
      peerDiscovery: [
//        MulticastDNS,
        wstar.discovery,
        Bootstrap
      ],
      pubsub: GossipSub,
      dht: dhtEnable ? KadDHT : undefined
    },
    config: {
      transport: {
        [ WStar.prototype[Symbol.toStringTag] ]: {
          upgrader: {
            localPeer: peerInfo,
            upgradeInbound: returnOp,
            upgradeOutbound: returnOp
          },
          wrtc
        }
      },
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
        enabled: dhtEnable,
        kBucketSize: 20
      },
      pubsub: {
        enabled: true
      }
    }
  });
  const _connectedDeferred = {};
  _connectedDeferred.promise = new Promise((resolve, reject) => {
    _connectedDeferred.resolve = resolve;
    _connectedDeferred.reject = reject;
  });
  return Object.assign(Object.create({
    async start() {
      this.socket.on('peer:connect', () => this._connectedDeferred.resolve());
      return await this.socket.start();
    },
    async waitForConnect() {
      return await this._connectedDeferred.promise;
    },
    async publish(topic, data) {
      return await this.socket.pubsub.publish(topic, jsonBuffer(data));
    },
    ln(v) {
      console.log(v);
      return v;
    },
    async subscribe(topic, handler) {
      return await this.socket.pubsub.subscribe(topic, (msg) => handler(this.ln({ msg, data: tryParse(msg.data) })));
    },
    async findPeer(peerId) {
      return await this.peerRouting.findPeer(peerId);
    }
  }), {
    _connectedDeferred,
    socket
  });
};

Object.assign(module.exports, {
  createNode
});
