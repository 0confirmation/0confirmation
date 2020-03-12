const { tryParse } = require('../lib/encoding')

module.exports = function subscribe(event, fn) {
  return this.node.pubsub.subscribe(
    event,
    msg => {
      if (msg.from == this.peerId) return;
      // console.log(`Received pubsub message\nfrom ${msg.from} on ${this.peerId}\n${msg.data}`)
      fn({ ...msg, data: tryParse(msg.data) })
    },
    () => {}
  )
}