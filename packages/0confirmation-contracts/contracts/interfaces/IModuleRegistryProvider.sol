pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "../BorrowProxyLib.sol";

contract IModuleRegistryProvider {
  function fetchModuleHandler(address to, bytes4 sig) external returns (BorrowProxyLib.Module memory);
}
