'use strict';

let id = 0;

module.exports = class RPCWrapper {
  async sendWrapped(method, params) {
    const response = await new Promise((resolve, reject) => this.send({
      id: id++,
      method,
      params,
      jsonrpc: '2.0'
    }, (err, result) => err ? reject(err) : resolve(result)));
    if (response.error) throw response.error;
    return response.result;
  }
};
