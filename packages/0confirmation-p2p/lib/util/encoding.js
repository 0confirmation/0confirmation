const tryParse = str => { try { return JSON.parse(str) } catch(e) { return str } }
const tryStringify = data => typeof data == 'string' ? data : JSON.stringify(data)
const jsonBuffer = data => Buffer.from(tryStringify(data))
const tryParseJsonBuffer = data => Buffer.isBuffer(data) ? tryParse(data.toString('utf8')) : tryParse(data)

module.exports = {
  tryParse,
  tryStringify,
  jsonBuffer,
  tryParseJsonBuffer
}
