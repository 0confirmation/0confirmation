'use strict';

import environments from '@0confirmation/sdk/environments';

import { Pair, Token, ChainId } from '@uniswap/sdk';

import { InfuraProvider } from "@ethersproject/providers";
import setupTestUniswapSDK from './uniswap';
import fromEthers from '@0confirmation/providers/from-ethers';
import { DECIMALS } from '../lib/utils';
const addresses = environments.getAddresses('testnet');
const getRenBTCToken = () =>
  new Token(
    ChainId.MAINNET,
    addresses.renbtc,
    DECIMALS.btc,
    "RenBTC",
    "RenBTC"
  );
const getWETHToken = () =>
  new Token(ChainId.MAINNET, addresses.weth, DECIMALS.weth, "WETH", "WETH");

const getDAIToken = () => new Token(ChainId.MAINNET, addresses.dai, DECIMALS.dai, "DAI", "DAI");

const provider = new InfuraProvider('kovan');

test('test uniswap addresses', async () => {
    await setupTestUniswapSDK(fromEthers(provider), () => addresses);
    const pairAddress = (await Pair.fetchData(getDAIToken(), getWETHToken(), provider)).liquidityToken.address;
    console.log(pairAddress);
});
