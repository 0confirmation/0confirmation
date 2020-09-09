pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { ModuleLib } from "../../lib/ModuleLib.sol";

library SmartFinalityAdapterLib {
  struct Isolate {
    address smartFinalityProxyKeeper;
  }
  function getCastStorageType() internal pure returns (function (uint256) internal pure returns (Isolate storage) swap) {
    function (uint256) internal returns (uint256) cast = ModuleLib.cast;
    assembly {
      swap := cast
    }
  }
  function toIsolatePointer(uint256 key) internal pure returns (Isolate storage) {
    return getCastStorageType()(key);
  }
  function getIsolatePointer() internal pure returns (Isolate storage) {
    return toIsolatePointer(computeIsolatePointer());
  }
  function computeIsolatePointer() public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.smart-finality-adapter")));
  }
}
