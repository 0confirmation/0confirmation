const { jsonBuffer } = require('../lib/encoding')

module.exports = function publish(event, data) {
  return this.node.pubsub.publish(event, jsonBuffer(data), () => {})
}
