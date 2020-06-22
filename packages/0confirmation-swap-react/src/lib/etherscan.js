"use strict";

import React from "react";
import { chainIdToName } from "./utils";

export const createEtherscanLinkFor = (s) =>
  s
    ? s.length === 66 || s.length === 42
      ? "https://" +
        chainIdToName(s) +
        ".etherscan.io/" +
        (s.length === 66 ? "tx/" : "address/") +
        s
      : "https://www.blockchain.com/btc-testnet/address/" + s
    : "";

export const createEtherscanLink = (s, text) => {
  const link = createEtherscanLinkFor(s);
  if (!link) return text;
  return (
    <a style={{ color: "white" }} target="_blank" rel="noreferrer" href={link}>
      {text}
    </a>
  );
};
