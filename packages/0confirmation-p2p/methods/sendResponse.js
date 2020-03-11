module.exports = function sendResponse(peerId, rqId, data, status) {
  return this.sendToNode(peerId, this.options.responseUrl, { rqId, data, status })
}