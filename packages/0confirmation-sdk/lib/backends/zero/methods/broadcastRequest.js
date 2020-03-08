const uuid = require('uuid/v4')
const { tryStringify } = require('../util/encoding')

module.exports = function broadcastRequest(method, data, ticks) {
  const rqId = uuid()
  this.publish(this.options.requestUrl, tryStringify({ method, data, rqId }))
  let timer;
  return new Promise((resolve, reject) => {
    this.pending[rqId] = { resolve, reject }
    // add better handling to remove request resolver on timeout
    timer = setTimeout(() => {
      if (this.pending[rqId]) reject(new Error(`Request timed out after ${this.options.requestTimeout / 1000} seconds`))
    }, this.options.requestTimeout);
  }).then((response) => {
    clearTimeout(timer);
    return response;
  }).catch((err) => {
    clearTimeout(timer);
    if (err.message && err.message.match('timed out')) {
      if ((ticks || 0) < 10) return broadcastRequest.call(this, method, data, (ticks || 0) + 1);
    }
    throw err;
  });
}
