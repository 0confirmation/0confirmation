pragma solidity ^0.6.2;

import { IShifter } from "./IShifter.sol";

interface IShifterRegistry {
  function getShifterByToken(address _tokenAddress) external view returns (IShifter);
}
