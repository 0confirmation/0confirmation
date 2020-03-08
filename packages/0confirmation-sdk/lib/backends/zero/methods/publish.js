const { jsonBuffer } = require('../util/encoding')

module.exports = function publish(event, data) {
  return this.pubsub.publish(event, jsonBuffer(data), () => {})
}
