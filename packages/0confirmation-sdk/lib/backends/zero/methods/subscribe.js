const { tryParse } = require('../util/encoding')

module.exports = function subscribe(event, fn) {
  return this.pubsub.subscribe(
    event,
    msg => {
      if (msg.from == this.peerId) return;
      // console.log(`Received pubsub message\nfrom ${msg.from} on ${this.peerId}\n${msg.data}`)
      fn({ ...msg, data: tryParse(msg.data) })
    },
    () => {}
  )
}
