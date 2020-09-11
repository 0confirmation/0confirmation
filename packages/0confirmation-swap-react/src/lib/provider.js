"use strict";

import globalObject from "the-global-object";
import fromEthers from "@0confirmation/providers/from-ethers";
import { makeEngine, makeBaseProvider } from "@0confirmation/providers";
import makeWalletSelectorFromProvider from "@0confirmation/providers/selector";

/*
import Migrations from "@0confirmation/sol/build/Migrations";
import ShifterPool from "@0confirmation/sol/build/ShifterPool";
import SandboxLib from "@0confirmation/sol/build/SandboxLib";
import SimpleBurnLiquidationModule from "@0confirmation/sol/build/SimpleBurnLiquidationModule";
import ShifterERC20Mock from "@0confirmation/sol/build/ShifterERC20Mock";
import ERC20Adapter from "@0confirmation/sol/build/ERC20Adapter";
import LiquidityToken from "@0confirmation/sol/build/LiquidityToken";
import CurveAdapter from "@0confirmation/sol/build/CurveAdapter";
import ShifterRegistryMock from "@0confirmation/sol/build/ShifterRegistryMock";
import ShifterBorrowProxyFactoryLib from "@0confirmation/sol/build/ShifterBorrowProxyFactoryLib";
import Curvefi from "@0confirmation/sol/build/Curvefi";
import CurveToken from "@0confirmation/sol/build/CurveToken";
import DAI from "@0confirmation/sol/build/DAI";
import WBTC from "@0confirmation/sol/build/WBTC";
import Exchange from "@0confirmation/sol/build/Exchange";
import Factory from "@0confirmation/sol/build/Factory";
import UniswapV2Router01 from "@0confirmation/sol/build/UniswapV2Router01";
import UniswapV2Factory from "@0confirmation/sol/build/UniswapV2Factory";

import UniswapV2Adapter from "@0confirmation/sol/build/UniswapV2Adapter";
import V2SwapAndDrop from "@0confirmation/sol/build/V2SwapAndDrop";
import WETH9 from "@0confirmation/sol/build/WETH9";
*/

import { ethers } from "ethers";

import makeArtifacts from "@0confirmation/artifacts";
const CHAIN = process.env.CHAIN || process.env.REACT_APP_CHAIN; // eslint-disable-line
const migrationSource ="";

const defer = () => {
  let promise, resolve, reject;
  promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject,
  };
};

/*
const builds = {
  Migrations,
  ShifterPool,
  SandboxLib,
  V2SwapAndDrop,
  UniswapV2Adapter,
  UniswapV2Factory,
  UniswapV2Router01,
  SimpleBurnLiquidationModule,
  ShifterERC20Mock,
  ERC20Adapter,
  LiquidityToken,
  CurveAdapter,
  ShifterRegistryMock,
  ShifterBorrowProxyFactoryLib,
  Curvefi,
  CurveToken,
  DAI,
  WBTC,
  WETH9,
  Exchange,
  Factory,
};
*/

let makeGanacheProvider = () =>
    fromEthers(new ethers.providers.JsonRpcProvider("http://localhost:8545")),
  setupEmbeddedMocks = () => Promise.resolve();
  makeGanacheProvider = () =>
          fromEthers(
            new ethers.providers.JsonRpcProvider(
              process.env.REACT_APP_GANACHE_URI || "http://localhost:8545" // eslint-disable-line
            )
          );

const engine = makeEngine();
const provider = engine.asProvider();
engine.push(async (req, res, next, end) => {
  try {
    if (
      [
        "eth_sendTransaction",
        "eth_sign",
        "eth_signTypedData",
        "personal_sign",
        "eth_accounts",
      ].includes(req.method)
    ) {
      if (req.method !== "eth_accounts" && provider.signingProvider.enable)
        await provider.signingProvider.enable();
      if (req.method === "eth_sendTransaction")
        await provider.signingProviderTargetsCorrectChainOrThrow();
      res.result = await provider.signingProvider
        .asEthers()
        .send(req.method, req.params);
    } else {
      res.result = await provider.dataProvider
        .asEthers()
        .send(req.method, req.params);
    }
  } catch (e) {
    res.error = e;
  }
  end();
});

const INFURA_PROJECT_ID = process.env.REACT_APP_INFURA_PROJECT_ID || '2f1de898efb74331bf933d3ac469b98d';

const chainToProvider = (chainId) => {
  switch (chainId) {
    case "1":
      return fromEthers(new ethers.providers.InfuraProvider("mainnet", INFURA_PROJECT_ID));
    case "42":
      return fromEthers(new ethers.providers.InfuraProvider("kovan", INFURA_PROJECT_ID));
    case "embedded":
    default:
      return makeGanacheProvider();
  }
};

provider.setSigningProvider = (signingProvider) => {
  provider.signingProvider = makeBaseProvider(signingProvider);
  if (signingProvider.enable)
    provider.signingProvider.enable = signingProvider.enable.bind(
      signingProvider
    );
};

provider.signingProviderTargetsCorrectChainOrThrow = async () => {
  const signingProviderChainId = Number(
    await provider.signingProvider.asEthers().send("net_version", [])
  );
  const dataProviderChainId = Number(
    await provider.dataProvider.asEthers().send("net_version", [])
  );
  if (signingProviderChainId !== dataProviderChainId)
    throw Error(
      "Your wallet does not point to network ID: " +
        String(dataProviderChainId) +
        ", select the correct network"
    );
};

provider.dataProvider = chainToProvider(CHAIN);

const getMemo = (v) => {
  const memo = v.sendAsync.memo;
  delete v.sendAsync.memo;
  return memo;
};

const makeFauxMetamaskSigner = (realProvider, metamask) => {
  const engine = makeEngine();
  const provider = engine.asProvider();
  if (metamask.enable) provider.enable = metamask.enable.bind(metamask);
  engine.push(async (req, res, next) => {
    if (
      req.method === "eth_sendTransaction" ||
      req.method === "personal_sign"
    ) {
      const memo = getMemo(metamask);
      await new Promise((resolve, reject) =>
        metamask.send(
          {
            method: "personal_sign",
            params: [
              metamask.selectedAddress,
              ethers.utils.hexlify(
                ethers.utils.toUtf8Bytes(
                  "0confirmation test transaction simulation" +
                    (memo ? ": " + memo : "")
                )
              ),
            ],
            id: Number((Math.random() * 10000).toFixed(0)),
          },
          (err) => (err ? reject(err) : resolve())
        )
      );
    }
    next();
  });
  engine.push(realProvider.asMiddleware());
  return provider;
};

if (globalObject.ethereum) {
  if (CHAIN === "embedded" || CHAIN === "external" || CHAIN === 'test')
    provider.setSigningProvider(
provider.dataProvider, globalObject.ethereum);
  else provider.setSigningProvider(globalObject.ethereum);
} else provider.signingProvider = provider.dataProvider;
provider.migrate = setupEmbeddedMocks;
if (CHAIN === "embedded" || CHAIN === 'test') globalObject.provider = provider;

//provider.builds = builds;
provider.makeFauxMetamaskSigner = makeFauxMetamaskSigner;
export default provider;
