'use strict';

const ethers = require('ethers')
const environments = require('@0confirmation/sdk/environments');
const ERC20Adapter = require('../build/ERC20Adapter');
const DAI = require('../build/DAI');
const LiquidityToken = require('../build/LiquidityToken');

const mainnet = environments.getAddresses('mainnet');
const Zero = require('@0confirmation/sdk');
const truffleConfig = require('../truffle-config');
const provider = truffleConfig.networks.mainnet.provider();

const NO_SUBMODULE = ethers.constants.AddressZero;

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};

const factory = new ethers.ContractFactory(LiquidityToken.abi, LiquidityToken.bytecode, new ethers.providers.Web3Provider(provider).getSigner());

const fixLiqToken = async () => {
  const zero = new Zero(provider, 'mainnet');
  const liquidityToken = await factory.deploy(mainnet.shifterPool, mainnet.renbtc, 'zeroBTC', 'zeroBTC', 8);
  console.log(liquidityToken.address);
  const tx = await zero.shifterPool.setup({
    shifterRegistry: mainnet.shifterRegistry,
    minTimeout: '10000',
    daoFee: ethers.utils.parseEther('0.01'),
    poolFee: ethers.utils.parseEther('0.01'),
    maxLoan: ethers.utils.parseEther('0.1')
  }, ...((v) => [ v.map((v) => ({ moduleType: v.moduleType, target: v.target, sigs: v.sigs })), v.map((v) => v.module) ])([]),
  [{
    token: mainnet.renbtc,
    liqToken: liquidityToken.address
  }], { gasPrice: ethers.utils.parseUnits('25', 9) });
  console.log(tx.hash);
  await tx.wait();
  console.log('done!');
};

fixLiqToken().catch((err) => console.error(err));
