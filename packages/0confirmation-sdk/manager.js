'use strict';

const ethers = require('ethers');
const uniqBy = require('lodash/uniqBy');
const { Web3Provider } = ethers.providers;

const ZERO_ADDRESS = '0x' + Array(40).fill('0').join('');

const EthersContract = Object.getPrototypeOf(new ethers.Contract(ZERO_ADDRESS, [], new ethers.getDefaultProvider()));

const wrapLog = (log, contract) => Object.assign(log, {
  getBlock: async () => await contract.provider.getBlock(log.blockHash),
  getTransaction: async () => await contract.provider.getTransaction(log.transactionHash),
  getTransactionReceipt: async () => await contract.provider.getTransactionReceipt(log.transactionHash)
});

class Manager {
  constructor() {}
  async getEvents(filterOpts = {}) {
    const iface = this.constructor.interface;
    if (!filterOpts.fromBlock && this.getGenesis) filterOpts.fromBlock = ethers.utils.hexlify(await this.getGenesis());
    else filterOpts.fromBlock = '0x0';
    const logs = (await this.contract.provider.getLogs(Object.assign({
      address: this.contract.address,
      toBlock: 'latest'
    }, filterOpts))).map((v) => wrapLog(Object.assign(v, {
      parsed: iface.parseLog(v)
    }), this.contract));
    for (const log of logs) {
      log.transaction = await log.getTransaction();
      log.decodedTransaction = iface.parseTransaction(log.transaction);
    }
    return logs;
  }
}

Object.setPrototypeOf(Manager.prototype, EthersContract);

const makeManagerClass = (artifact) => {
  const contract = new ethers.Contract(ZERO_ADDRESS, uniqBy(artifact.abi, 'name'), new ethers.providers.InfuraProvider('kovan'));
  const EthersContract = Object.getPrototypeOf(contract);
  const ManagerClassStatics = {
    networks: artifact.networks,
    abi: artifact.abi,
    interface: new ethers.utils.Interface(artifact.abi),
    functions: contract.functions
  };
  const managerClass = class DerivedManager extends Manager {
    static async deploy(provider, ...args) {
      const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, provider.getSigner());
      return await factory.deploy(...args);
    }
    constructor(address, providerOrSigner) {
      super();
      this.contract = contract.attach(address).connect(providerOrSigner);
      this.address = address;
    }
  };
  Object.assign(managerClass, ManagerClassStatics);
  Object.keys(contract.functions).forEach((v) => {
    managerClass.prototype[v] = async function (...args) { return await this.contract[v](...args); };
  });
  managerClass.prototype._events = contract._events;
  return managerClass;
};

Object.assign(module.exports, {
  makeManagerClass
});
