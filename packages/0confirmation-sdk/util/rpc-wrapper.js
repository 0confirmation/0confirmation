'use strict';

let id = 0;

module.exports = class RPCWrapper {
  async sendWrapped(method, params) {
    const response = await this.send({
      id: id++,
      method,
      params,
      jsonrpc: '2.0'
    });
    if (response.error) throw response.error;
    return response.result;
  }
};
