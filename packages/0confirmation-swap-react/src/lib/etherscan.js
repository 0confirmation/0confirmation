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
    let r = null
    if (s.length === 55 || s.length === 42 || s.length === 66) {
      let etherscanPrefix = ''
      if (Number(CHAIN) !== 1) etherscanPrefix = 'kovan.';
      r = ("https://" +
            etherscanPrefix +
            "etherscan.io/" +
            (s.length === 66 ? "tx/" : "address/") +
            s)
      console.log("etherscan link: ", r)
    } else {
      let btcPrefix = 'btc'
      let txOrAddress = '/address/'
      if (Number(CHAIN) !== 1) btcPrefix = 'btc-testnet'
      if (s.length === 64) txOrAddress = '/tx/'
      r = ("https://www.blockchain.com/" + 
           btcPrefix + txOrAddress + s);  

      console.log("bitcoin link: ", r)

    }
    return r
  }
  

export const createEtherscanLink = (s, text) => {
  const link = createEtherscanLinkFor(s);
  if (!link) return text;
  return (
    <a style={{ color: "white", textDecoration: "none" }} target="_blank" rel="noreferrer" href={link}>
      {text}
    </a>
  );
};
