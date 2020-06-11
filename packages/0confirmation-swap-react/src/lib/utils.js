"use strict";

import {ethers} from "ethers";

export const DECIMALS = {
  btc: 8,
  dai: 18,
  weth: 18,
};

export const chainIdToName = (n) => {
  switch (String(n)) {
    case "1":
      return "mainnet";
    case "42":
      return "kovan";
  }
  return "kovan";
};

export const pollForBorrowProxy = async (deposited) => {
  for (;;) {
    try {
      var proxy = await deposited.getBorrowProxy();
      if (proxy) return proxy;
      else throw Error();
    } catch (e) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

export const truncateDecimals = (s, e) => {
  s = String(s);
  const i = s.lastIndexOf(".");
  if (~i) {
    const decimals = s.length - i - 1;
    if (decimals <= e) return s;
    return s.substr(0, i + e + 1).replace(/\.$/, "");
  }
  return s;
};

export const coerceToDecimals = (nameOrDecimals) =>
  typeof nameOrDecimals === "string" && isNaN(nameOrDecimals)
    ? DECIMALS[nameOrDecimals]
    : Number(nameOrDecimals);

export const toFormat = (v, decimals) =>
  truncateDecimals(ethers.utils.formatUnits(v, coerceToDecimals(decimals)), 4);

export const toParsed = (v, decimals) =>
  ethers.utils.parseUnits(v, coerceToDecimals(decimals));

export const defer = () => {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    resolve,
    reject,
    promise,
  };
};
