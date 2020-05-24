// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { TestToken } from "./TestToken.sol";

contract ShifterERC20Mock is TestToken {
  constructor() TestToken("zBTC", "zBTC", 8) public {}
}
