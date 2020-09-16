// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { TestToken } from "./TestToken.sol";

contract USDC is TestToken {
  constructor() TestToken("USDC", "USDC", 18) public {}
}
