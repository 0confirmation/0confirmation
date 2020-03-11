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
const pull = require('pull-stream');
const EventEmitter = require('events').EventEmitter;
const wrtc = require('wrtc');
const returnOp = (v) => v;

const { jsonBuffer, tryParse, tryStringify } = require('./util');

const WStar = require('libp2p-webrtc-star');

const createNode = async (options) => {
  const peerInfo = options.peerInfo || await PeerInfo.create();
  peerInfo.multiaddrs.add(options.multiaddr + 'p2p/' + peerInfo.id.toB58String());
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
  BoundStar.prototype.__proto__ = WStar.prototype;
  const socket = await libp2p.create({
    peerInfo,
    modules: {
      transport: [ TCP, WS, BoundStar ],
      streamMuxer: [ Mplex, SPDY ],
      connEncryption: [ SECIO ],
      peerDiscovery: [
//        MulticastDNS,
        wstar.discovery,
//        Bootstrap
      ],
      pubsub: GossipSub,
      dht: dhtEnable ? KadDHT : undefined
    },
    config: {
      transport: {
        [ WStar.prototype[Symbol.toStringTag] ]: {
          upgrader: {
            localPeer: peerInfo.id,
            upgradeInbound: returnOp,
            upgradeOutbound: returnOp
          },
          wrtc
        }
      },
      peerDiscovery: {
        mdns: {
          interval: 2000,
          enabled: false
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
        enabled: true,
        emitSelf: false
      }
    }
  });
  const _connectedDeferred = {};
  _connectedDeferred.promise = new Promise((resolve, reject) => {
    _connectedDeferred.resolve = resolve;
    _connectedDeferred.reject = reject;
  });
  const _foundPeerDeferred = {};
  _foundPeerDeferred.promise = new Promise((resolve, reject) => {
    _foundPeerDeferred.resolve = resolve;
    _foundPeerDeferred.reject = reject;
  });
//  socket.on('peer:discovery', (peer) => console.log('from peer: ' + peerInfo.id.toB58String() + '\n' + JSON.stringify(peer)));
  return Object.assign(Object.create({
    async start() {
      this.socket.on('peer:connect', () => this._connectedDeferred.resolve());
      this.socket.on('peer:discovery', async (peer) => {
        try {
          await this.socket.dial(peer);
          console.log('dialed ' + JSON.stringify(peer));
        } catch (e) {
          console.error(e);
        }
        if (this._foundPeerDeferred.resolve) {
          this._foundPeerDeferred.resolve();
          delete this._foundPeerDeferred.resolve;
        }
      });
      return await this.socket.start();
    },
    async waitForPeer() {
      return await this._foundPeerDeferred.promise;
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
    handleProtocol(name, fn) {
      return this.socket.handle(name, async ({
        stream,
      }) => {
        let buffer = '';
        console.log('handled');
        for await (const chunk of stream) {
          buffer += chunk.toString('utf8');
        }
        return fn(buffer);
      });
    },
    async subscribe(topic, handler) {
      return await this.socket.pubsub.subscribe(topic, (msg) => handler(this.ln({ msg, data: tryParse(msg.data) })));
    },
    async getSubscribers(topic) {
      return await this.socket.pubsub.getSubscribers(topic);
    },
    async findPeer(peerId) {
      return await this.peerRouting.findPeer(peerId);
    }
  }), {
    _connectedDeferred,
    _foundPeerDeferred,
    socket
  });
};

Object.assign(module.exports, {
  createNode
});
