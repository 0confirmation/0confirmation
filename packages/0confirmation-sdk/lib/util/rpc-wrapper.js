'use strict';

let id = 0;

module.exports = class RPCWrapper {
  async sendWrapped(method, params) {
    console.log([ method, params ]);
    const response = await this.send({
      id: id++,
      method,
      params,
      jsonrpc: '2.0'
    });
    if (response.error) throw Error(response.error);
    return response.result;
  }
};
