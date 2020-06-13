"use strict";

import { ethers } from "ethers";
import { staticPreprocessor } from "@0confirmation/sdk";

export const encodeAddressTriple = (a, b, c) =>
  ethers.utils.defaultAbiCoder.encode(
    ["bytes"],
    [
      ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "address"],
        [a, b, c]
      ),
    ]
  );

export const createSwapActions = ({ dai, router, borrower, swapAndDrop }) => [
  staticPreprocessor(swapAndDrop, encodeAddressTriple(router, dai, borrower)),
];
