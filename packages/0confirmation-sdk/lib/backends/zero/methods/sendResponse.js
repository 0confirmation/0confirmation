module.exports = function sendResponse(peerId, responseUrl, id, data) {
  return this.sendToNode(peerId, responseUrl || this.options.responseUrl, { id, result: data, jsonrpc: '2.0' });
}
