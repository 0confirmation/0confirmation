'use strict';

const { keyBy, mapValues } = require('lodash');
const ethers = require('ethers');
const linker = require('solc/linker');
const vm = require('vm');

class Artifact {
  constructor(builtArtifact, provider) {
    Object.assign(this, builtArtifact);
    this.contract = {
      currentProvider: provider
    };
    this.currentProvider = provider;
    this.abi = builtArtifact.abi;
    this.bytecode = builtArtifact.bytecode;
  }
  getContractFactory() {
    return new ethers.ContractFactory(this.abi, this.bytecode, new ethers.providers.Web3Provider(this.contract.currentProvider).getSigner());
  }
  async deploy(...args) {
    const factory = this.getContractFactory();
    const { address } = await factory.deploy(...(typeof args[args.length - 1] !== 'object' && args.concat({
      gasLimit: ethers.utils.hexlify(6e6)
    }) || args));
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
    const keyed = keyBy(this.abi, 'name');
    Object.keys(contract).forEach((v) => {
      if (typeof contract[v] === 'function') deployed[v] = (...args) => {
        console.log(v);
        console.log(keyed[v])
        return contract[v](...((typeof args[args.length - 1] === 'object' || (keyed[v].constant || keyed[v].stateMutability === 'view' || keyed[v].stateMutability === 'pure')) && args || args.concat({
          gasLimit: ethers.utils.hexlify(6e6)
        })));
      };
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

const makeArtifacts = (provider, build) => Object.assign(Object.create({
  prepareMigration(migrationSource, modules = {}) {
    const context = vm.createContext();
    context.module = {
      exports: {}
    };
    context.artifacts = this;
    context.require = (requireString) => modules[requireString];
    vm.runInContext(migrationSource, context);
    return context.module.exports;
  },
  async runMigration(migrationSource, modules = {}) {
    const migration = this.prepareMigration(migrationSource, modules);
    await migration(deployer);
  },
  require(name) {
    return this[name];
  }
}), mapValues(build, (builtArtifact) => new Artifact(builtArtifact, provider)));

module.exports = makeArtifacts;
