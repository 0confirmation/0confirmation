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

const fixMainnetAddresses = async () => {
  const zero = new Zero(provider, 'mainnet');
  const tx = await zero.shifterPool.setup({
    shifterRegistry: mainnet.shifterRegistry,
    minTimeout: '10000',
    daoFee: ethers.utils.parseEther('0.01'),
    poolFee: ethers.utils.parseEther('0.01'),
    maxLoan: ethers.utils.parseEther('0.1')
  }, ...((v) => [ v.map((v) => ({ moduleType: v.moduleType, target: v.target, sigs: v.sigs })), v.map((v) => v.module) ])([{
    moduleType: ModuleTypes.BY_ADDRESS,
    target: mainnet.renbtc,
    sigs: Zero.getSignatures(DAI.abi),
    module: {
      isPrecompiled: false,
      assetSubmodule: ERC20Adapter.networks[1].address,
      repaymentSubmodule: ERC20Adapter.networks[1].address,
      liquidationSubmodule: NO_SUBMODULE
    }
  }]),
  [{
    token: mainnet.renbtc,
    liqToken: LiquidityToken.networks[1].address
  }], { gasPrice: ethers.utils.parseUnits('25', 9) });
  console.log(tx.hash);
  await tx.wait();
  console.log('done!');
};

fixMainnetAddresses().catch((err) => console.error(err));
