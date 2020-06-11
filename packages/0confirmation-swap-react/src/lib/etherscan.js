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
      : "https://blockchain.info/btc/address/" + s
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
