"use strict";

import { Pair, INIT_CODE_HASH, ChainId } from "@uniswap/sdk";
import { Web3Provider } from "@ethersproject/providers";

import { ethers } from "ethers";

export default async function setupTestUniswapSDK(provider, getContracts) {
  const ethersProvider = new Web3Provider(provider);
  const chainId = await ethersProvider.send("net_version", []);
  ChainId.MAINNET = Number(chainId);
  Pair.getAddress = (tokenA, tokenB) => {
    const tokens = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA]; // does safety checks
    return ethers.utils.getCreate2Address({
      from: getContracts().factory,
      salt: ethers.utils.arrayify(
        ethers.utils.solidityKeccak256(
          ["address", "address"],
          [tokens[0].address, tokens[1].address]
        )
      ),
      initCodeHash: ethers.utils.arrayify(INIT_CODE_HASH),
    });
  };
}
