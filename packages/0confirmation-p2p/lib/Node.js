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

class Node extends libp2p {
  constructor (_options, useDHT) {
    const wsstar = new WebSocketStar({ id: _options.peerInfo.id })

    const defaults = {
      modules: {
        transport: [ TCP, WS, wsstar ],
        streamMuxer: [ Mplex, SPDY ],
        connEncryption: [ SECIO ],
        peerDiscovery: [
          wsstar.discovery,
          // MulticastDNS, // removing this breaks peer discovery
          Bootstrap
        ],
        dht: useDHT ? KadDHT : undefined
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
            list: [
              // '/ip4/134.209.168.132/tcp/9090/ws/p2p-websocket-star/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP'
              // '/ip4/134.209.168.132/tcp/10333/ws/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP' // websocket connection to bootstrap server on droplet
            ]
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
          enabled: useDHT,
          kBucketSize: 20
        },
        EXPERIMENTAL: {
          pubsub: true
        }
      }
    }

    super(defaultsDeep(_options, defaults))
  }
}

module.exports = Node
