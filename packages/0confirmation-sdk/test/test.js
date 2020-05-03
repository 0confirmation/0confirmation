'use strict';

const Zero = require('../');
const ethers = require('ethers');
const SwapEntireLoan = require('@0confirmation/sol/build/SwapEntireLoan');
const provider = new ethers.providers.Web3Provider(require('ganache-cli').provider());

const getFactory = (artifact) => new ethers.ContractFactory(artifact.abi, artifact.bytecode, provider.getSigner());
const swapEntireLoanFactory = getFactory(SwapEntireLoan);
const { defaultAbiCoder: abi } = ethers.utils;
const disassemble = require('kool-evmdis');

const encodeTwoAddresses = (a, b) => abi.encode([ 'bytes' ], [ abi.encode([ 'address', 'address' ], [ a, b ]) ]);

describe('zero sdk', () => {
  it('should deploy a static preprocessor', async () => {
    const { address: implementation } = await swapEntireLoanFactory.deploy();
    const preprocessor = Zero.staticPreprocessor(implementation, encodeTwoAddresses(ethers.constants.AddressZero, ethers.constants.AddressZero));
    const preprocessorFactory = getFactory({
      abi: [],
      bytecode: preprocessor.calldata
    });
    await preprocessorFactory.deploy();
  });
});
    
