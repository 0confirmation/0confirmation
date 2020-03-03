const { jsonBuffer } = require('../util/encoding')

module.exports = function publish(event, data) {
  return this.node.pubsub.publish(event, jsonBuffer(data), () => {})
}
