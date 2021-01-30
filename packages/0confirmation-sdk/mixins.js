'use strict';

const ISafeViewExecutor = require('@0confirmation/sol/build/ISafeViewExecutor');
const ethers = require('ethers');

module.exports.safeViewExecutorMixin = (managerClass) => {
  Object.assign(managerClass.prototype, {
    query(creationCode, context) {
      const safeViewInterface = new ethers.Contract(this.address, ISafeViewExecutor.abi, this.signer || this.provider);
      return safeViewInterface.query(creationCode, context);
    }
  });
};
