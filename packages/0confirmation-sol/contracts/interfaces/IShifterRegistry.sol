pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { IShifter } from "./IShifter.sol";

interface IShifterRegistry {
  function getShifterByToken(address _tokenAddress) external view returns (IShifter);
}
