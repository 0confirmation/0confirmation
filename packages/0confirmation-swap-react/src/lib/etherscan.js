"use strict";

import React from "react";
const CHAIN = process.env.REACT_APP_CHAIN; // eslint-disable-line


export const createEtherscanLinkFor = (s) =>
  // s
  //   ? s.length === 66 || s.length === 42
  //     ? "https://" +
  //       Number(CHAIN) === 1 ? 'mainnet' : 'kovan' +
  //       ".etherscan.io/" +
  //       (s.length === 66 ? "tx/" : "address/") +
  //       s
  //     : "https://www.blockchain.com/" + 
  //     Number(CHAIN) === 1 ? 'btc' : 'btc-testnet' + 
  //     s.length === 64 ? "/tx/" : "/address/" + s
  //   : "";
  {
    console.log("S = " + s)
    let r = null
    if (s.length === 55 || s.length === 42) {
      r = ("https://" +
            Number(CHAIN) === 1 ? 'mainnet' : 'kovan' +
            ".etherscan.io/" +
            (s.length === 66 ? "tx/" : "address/") +
            s)
    } else if (s.length === 66) {
      r = ("https://www.blockchain.com/" + 
          Number(CHAIN) === 1 ? 'btc' : 'btc-testnet' + 
          s.length === 64 ? "/tx/" : "/address/" + s)
    }
    console.log("r = " + r)
    return r
  }
  

export const createEtherscanLink = (s, text) => {
  const link = createEtherscanLinkFor(s);
  if (!link) return text;
  return (
    <a style={{ color: "white" }} target="_blank" rel="noreferrer" href={link}>
      {text}
    </a>
  );
};
