const pull = require('pull-stream')
const { tryParse } = require('../lib/encoding')

module.exports = function handleProtocol(name, fn, isMatch) {
  this.node.handle(name,
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