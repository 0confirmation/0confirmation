'use strict';

const genesisQuery = require('./queries/query-genesis');
const ShifterPoolArtifact = require('@0confirmation/sol/build/ShifterPool');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const ethers = require('ethers');

const { safeViewExecutorMixin } = require('./mixins');

class ShifterPool extends makeManagerClass(Object.assign({}, ShifterPoolArtifact, {
  abi: ShifterPoolArtifact.abi.concat(BorrowProxyLib.abi)
})) {
  static fromAddressAndProvider(address, providerOrSigner) {
    return new ShifterPool({
      network: {
        shifterPool: address
      },
      getProvider: () => ({
        asEthers: () => providerOrSigner
      })
    }) 
  }
  static getDefault() {
    return ShifterPool.fromAddressAndProvider(ethers.constants.AddressZero, new ethers.providers.InfuraProvider('kovan'));
  }
  constructor(address, provider, zero) {
    super(address, provider);
    this.zero = zero;
  }
  async getGenesis() {
    return await genesisQuery(this);
  }
}
safeViewExecutorMixin(ShifterPool);

module.exports = ShifterPool;
