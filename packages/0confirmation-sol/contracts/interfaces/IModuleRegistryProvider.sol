pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "../BorrowProxyLib.sol";

interface IModuleRegistryProvider {
  function fetchModuleHandler(address to, bytes4 sig) external returns (BorrowProxyLib.Module memory);
}
