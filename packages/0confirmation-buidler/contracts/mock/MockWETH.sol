// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { TestToken } from "./TestToken.sol";

contract MockWETH is TestToken {
  constructor() TestToken("WETH", "WETH", 18) public {}
  function deposit() public {}
  function withdraw(uint256) public {}
}
