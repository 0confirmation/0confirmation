// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
const bre = require("@nomiclabs/buidler");
const environments = require('@0confirmation/sdk/environments');
const Zero = require('@0confirmation/sdk');

const ModuleTypes = {
  BY_CODEHASH: 1,
  BY_ADDRESS: 2
};

const networks = {
  kovan: environments.getAddresses('testnet'),
  mainnet: environments.getAddresses('mainnet')
};

const chainIdToNetwork = (network) => {
  switch (network) {
      case 1:
        return 'mainnet';
      case 42:
        return 'kovan'
      default:
        return 'test'
  }
};

const makePush = (ary) => (v) => {
  ary.push(v);
  return v
};

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { log, deploy } = deployments;
    const { ethers } = bre;
    const { AddressZero: NO_SUBMODULE } = ethers.utils;
    const { deployer } = await getNamedAccounts();
    const chain = chainIdToNetwork(Number(await bre.getChainId()));
    const shifterBorrowProxyFactoryLib = await deploy("ShifterBorrowProxyFactoryLib", {
        from: deployer,
        contractName: "ShifterBorrowProxyFactoryLib",
        args: [],
    });
    const shifterPool = await deploy("ShifterPool", {
        from: deployer,
        contractName: "ShifterPool",
        args: [],
        libraries: {
            ["ShifterBorrowProxyFactoryLib"]: shifterBorrowProxyFactoryLib.address
        },
    });
    const erc20Adapter = await deploy("ERC20Adapter", {
        from: deployer,
        contractName: "ERC20Adapter",
        args: []
    });
    const v2SwapAndDrop = await deploy("V2SwapAndDrop", {
        from: deployer,
        contractName: "V2SwapAndDrop",
        args: []
    });
    const transferAll = await deploy("TransferAll", {
        from: deployer,
        contractName: "V2SwapAndDrop",
        args: []
    });
    const deployed = [
      shifterBorrowProxyFactoryLib,
      shifterPool,
      erc20Adapter,
      v2SwapAndDrop,
      transferAll
    ];
    const push = makePush(deployed);
    let weth, shifterRegistry, dai, renbtc, factory, router, from;
    switch (chain) {
      case 'mainnet':
      case 'kovan':
        renbtc = { address: networks[chain].renbtc };
        shifterRegistry = { address: networks[chain].shifterRegistry };
        router = { address: networks[chain].router };
        factory = { address: networks[chain].factory };
        weth = { address: networks[chain].weth };
        dai = { address: networks[chain].dai };
        break;
      case 'test':
        weth = push(await deploy("WETH9", {
          from: deployer,
          contractName: "WETH9",
          args: []
        }));
        dai = push(await deploy("DAI", {
          from: deployer,
          contractName: 'DAI',
          args: []
        }));
        shifterRegistry = push(await deploy("ShifterRegistryMock", {
          from: deployer,
          contractName: 'ShifterRegistryMock',
          args: []
        }));
        renbtc = {
          address: await shifterRegistry.token()
        };
        factory = push(await deploy("UniswapV2Factory", {
          from: deployer,
          contractName: "UniswapV2Factory",
          args: [deployer]
        }))
        router = push(await deploy("UniswapV2Router01", {
          from: deployer,
          contractName: "UniswapV2Router01",
          args: [ factory.address, weth.address ]
        })
        await factory.createPair(weth.address, renbtc.address); // { gasLimit: ethers.utils.hexlify(6e6) });
        await factory.createPair(weth.address, dai.address); //, { gasLimit: ethers.utils.hexlify(6e6) });
    }
    const uniswapV2Adapter = push(await deploy("UniswapV2Adapter", {
      from: deployer,
      contractName: "UniswapV2Adapter",
      args: [erc20Adapter.address]
    }));
    const simpleBurnLiquidationModule = push(await deploy("SimpleBurnLiquidationModule", {
      from: deployer,
      contractName: 'SimpleBurnLiquidationModule',
      args: [ router.address, erc20Adapter.address ]
    }));
    const liquidityToken = push(await deploy("LiquidityToken", {
      from: deployer,
      contractName: 'LiquidityToken',
      args: [ shifterPool.address, renbtc.address, 'zeroBTC', 'zeroBTC', 8 ]
    }));
    await shifterPool.deployBorrowProxyImplementation();
    await shifterPool.deployAssetForwarderImplementation();
    await shifterPool.setup({
      shifterRegistry: shifterRegistry.address,
      minTimeout: chain === 'test' ? '1' :'10000',
      daoFee: ethers.utils.parseEther('0.01'),
      poolFee: ethers.utils.parseEther('0.01'),
      maxLoan: chain === 'mainnet' ? ethers.utils.parseEther('0.1') : ethers.utils.parseEther('10')
  }, ...((v) => [ v.map((v) => ({ moduleType: v.moduleType, target: v.target, sigs: v.sigs })), v.map((v) => v.module) ])([{
        moduleType: ModuleTypes.BY_ADDRESS,
        target: renbtc.address,
        sigs: Zero.getSignatures(DAI.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: erc20Adapter.address,
          repaymentSubmodule: erc20Adapter.address,
          liquidationSubmodule: NO_SUBMODULE
        }
      }, {
        moduleType: ModuleTypes.BY_ADDRESS,
        target: router.address,
        sigs: Zero.getSignatures(UniswapV2Router01.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: uniswapAdapter.address,
          repaymentSubmodule: '0x' + Array(40).fill('0').join(''),
          liquidationSubmodule: simpleBurnLiquidationModule.address
        }
      }, {
        moduleType: ModuleTypes.BY_ADDRESS,
        target: dai.address,
        sigs: Zero.getSignatures(DAI.abi),
        module: {
          isPrecompiled: false,
          assetSubmodule: erc20Adapter.address,
          repaymentSubmodule: erc20Adapter.address,
          liquidationSubmodule: NO_SUBMODULE
        }
      }]), [{
      token: renbtc.address,
      liqToken: liquidityToken.address
    }]);
    for (let i = 0; i < deployed.length; i++) {
        if (deployed[i].newlyDeployed)
            log(
                `Contract deployed at ${deployed[i].address} using ${deployed[i].receipt.gasUsed} gas on chain ${chain}`
            );
    }
};
