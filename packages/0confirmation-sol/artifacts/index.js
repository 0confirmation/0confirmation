'use strict';

const { mapValues } = require('lodash');
const ethers = require('ethers');
const linker = require('solc/linker');

const build = {
  Migrations: require('../build/Migrations'),
  ShifterPool: require('../build/ShifterPool'),
  SandboxLib: require('../build/SandboxLib'),
  UniswapAdapter: require('../build/UniswapAdapter'),
  SimpleBurnLiquidationModule: require('../build/SimpleBurnLiquidationModule'),
  ShifterERC20Mock: require('../build/ShifterERC20Mock'),
  ERC20Adapter: require('../build/ERC20Adapter'),
  LiquidityToken: require('../build/LiquidityToken'),
  CurveAdapter: require('../build/CurveAdapter'),
  ShifterRegistryMock: require('../build/ShifterRegistryMock'),
  ShifterBorrowProxyFactoryLib: require('../build/ShifterBorrowProxyFactoryLib'),
  Curvefi: require('../build/Curvefi'),
  CurveToken: require('../build/CurveToken'),
  DAI: require('../build/DAI'),
  WBTC: require('../build/WBTC'),
  Exchange: require('../build/Exchange'),
  Factory: require('../build/Factory')
};

class Artifact {
  constructor(builtArtifact, provider) {
    Object.assign(this, builtArtifact);
    this.contract = {
      currentProvider: provider
    };
  }
  getContractFactory() {
    return new ethers.ContractFactory(this.abi, this.bytecode, new ethers.providers.Web3Provider(this.contract.currentProvider).getSigner());
  }
  async deploy(...args) {
    const factory = this.getContractFactory();
    const { address } = await factory.deploy(...args);
    this.address = address;
    return await this.deployed();
  }
  async deployed() {
    const contract = new ethers.Contract(this.address, this.abi, new ethers.providers.Web3Provider(this.contract.currentProvider).getSigner());
    const proto = Object.getPrototypeOf(contract);
    const deployed = {
      contract: {
        currentProvider: this.contract.currentProvider
      }
    };
    Object.keys(contract).forEach((v) => {
      if (typeof contract[v] === 'function') deployed[v] = (...args) => contract[v](...args);
      else deployed[v] = contract[v];
    });
    return Object.setPrototypeOf(deployed, proto);
  }
}

const deployer = Object.assign(Promise.resolve(), {
  network: 'test',
  deploy: async (artifact, ...args) => await artifact.deploy(...args),
  link: async (lib, target) => {
    target.bytecode = linker.linkBytecode(target.bytecode, {
      [ lib.contractName ]: (await lib.deployed()).address
    })
  }
});

const makeArtifacts = (provider) => Object.assign(Object.create({
  async runMigration(migration) {
    await (migration(this, provider))(deployer);
  },
  require(name) {
    return this[name];
  }
}), mapValues(build, (builtArtifact) => new Artifact(builtArtifact, provider)));

module.exports = makeArtifacts;
