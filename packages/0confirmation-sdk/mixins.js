'use strict';

const ISafeViewExecutor = require('@0confirmation/sol/build/ISafeViewExecutor');
const ethers = require('ethers');

module.exports.safeViewExecutorMixin = (managerClass) => {
  Object.assign(managerClass.prototype, {
    query(creationCode, context) {
      const safeViewInterface = new ethers.Contract(this.contract.address, ISafeViewExecutor.abi, this.contract.signer || this.contract.provider);
      return safeViewInterface.query(creationCode, context);
    }
  });
};
