module.exports = function handleResponse(resp) {
  // console.log(`Got response`)
  const { rqId, data, status } = resp
  const rqFns = this.pending[rqId]
  if (!rqFns || data == undefined || !status) return
  else if (status == 'success') rqFns.resolve(data)
  else rqFns.reject(data)
  delete this.pending[rqId]
}
