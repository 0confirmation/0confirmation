const pull = require('pull-stream')
const { tryParse } = require('../util/encoding')

module.exports = function handleProtocol(name, fn, isMatch) {
  this.handle(name,
    (protocol, conn) => {
      pull(
        conn,
        pull.map(data => tryParse(data.toString('utf8'))), // parse all data in stream
        pull.drain(d => fn(d)) // give callback the requested path and received data
      )
    },
    isMatch ? (_, rqProtocol, matchCb) => matchCb(null, isMatch(rqProtocol)) : undefined
  )
}
