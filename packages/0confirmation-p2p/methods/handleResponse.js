module.exports = function handleResponse(resp) {
  // console.log(`Got response`)
  const { rqId, data, status } = resp
  const { transactions, header } = data;
  if (data && transactions && header == null) return
  const rqFns = this.pending[rqId]
  if (!rqFns || data == undefined || !status) return
  else if (status == 'success') rqFns.resolve(data)
  else rqFns.reject(data)
  delete this.pending[rqId]
}
