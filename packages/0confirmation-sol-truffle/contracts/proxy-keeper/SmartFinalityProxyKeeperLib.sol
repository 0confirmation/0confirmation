// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { SmartFinalityLib } from "./SmartFinalityLib.sol";
import { ShifterPool } from "../ShifterPool.sol";

library SmartFinalityProxyKeeperLib {
  using SafeMath for *;
  struct Isolate {
    address shifterPool;
    uint256 confirmationThreshold;
    bytes32 reqId;
    mapping (address => SmartFinalityLib.FinalityCheckRecord) finalityCheck;
    mapping (bytes32 => address) reqIdToAddress;
  }
  function getNextId(Isolate storage isolate) internal returns (bytes32 next) {
    next = isolate.reqId;
    isolate.reqId = bytes32(uint256(next).add(1));
  }
  function computeProxyAddress(Isolate storage isolate, bytes32 salt) internal view returns (address proxyAddress) {
    proxyAddress = ShifterPool(isolate.shifterPool).computeProxyAddress(salt);
  }
}
