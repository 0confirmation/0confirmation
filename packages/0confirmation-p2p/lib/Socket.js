const EventEmitter = require('events')
const methods = require('./methods')

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

class Socket extends EventEmitter {
  constructor(peerInfo, options = {}) {
    super()
    this.peerInfo = peerInfo
    this.peers = {}
    this.pending = {}
    this.options = Object.assign(defaultOptions, options)
  }

  stop() { return this.node.stop() }
}

Object.assign(Socket.prototype, methods);


module.exports = Socket
