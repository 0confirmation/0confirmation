const timer = require('../util/timer')

module.exports = function () {
  this.node.on('peer:discovery', (peer) => this.handleDiscover(peer))
  this.node.on('peer:connect', (peer) => this.handleConnect(peer))
  this.node.on('peer:disconnect', (peer) => this.handleDisconnect(peer))

  const options = this.options
  this.handleProtocol(options.responseUrl, (msg) => this.handleResponse(msg))
  if (!(options.waitForConnect || options.acceptRequests)) return;
  return new Promise((resolve, reject) => {
    let _timeout = timer(options.initialConnectTimeout)
      .then(() => reject(
        `Failed to connect to other nodes after ${this.options.initialConnectTimeout} ms`
      ))
    this.once('connect', () => { resolve(); })
  })
  .then(() => {
    if (!options.acceptRequests) return;
    return timer(options.connectDelay).then(() => {
      this.subscribe(options.requestUrl, msg => this.emit('request', msg))
      return
    })
  });
}
