pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";
import { ERC20Forwarder } from "./ERC20Forwarder.sol";

library ERC20AdapterLib {
  struct EscrowRecord {
    address recipient;
    address token;
  }
  struct Isolate {
    EscrowRecord[] payments;
    bool isProcessing;
    uint256 processed;
  }
  function isDone(Isolate storage isolate) internal view returns (bool) {
    return !isolate.isProcessing && isolate.payments.length == isolate.processed;
  }
  function computeIsolatePointer() public pure returns (uint256) {
    return uint256(keccak256("isolate.erc20-adapter"));
  }
  function computeForwarderSalt(uint256 index) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(index));
  }
  function computeForwarderAddress(uint256 index) internal view returns (address) {
    return Create2.computeAddress(computeForwarderSalt(index), keccak256(type(ERC20Forwarder).creationCode));
  }
  function liquidate() internal returns (bool) {
    ERC20AdapterLib.Isolate storage isolate = getIsolatePointer();
    return processEscrowReturns(isolate);
  }
  function forwardEscrow(EscrowRecord memory record, uint256 index) internal {
    address forwarder = Create2.deploy(computeForwarderSalt(index), type(ERC20Forwarder).creationCode);
    ERC20Forwarder(forwarder).forwardToken(record);
  }
  function returnEscrow(EscrowRecord memory record, uint256 index) internal {
    address forwarder = Create2.deploy(computeForwarderSalt(index), type(ERC20Forwarder).creationCode);
    ERC20Forwarder(forwarder).returnToken(record);
  }
  uint256 constant MINIMUM_GAS_TO_PROCESS = 5e5;
  uint256 constant MAX_RECORDS = 100;
  function processEscrowForwards(Isolate storage isolate) internal returns (bool) {
    if (!isolate.isProcessing) isolate.isProcessing = true;
    for (uint256 i = isolate.processed; i < isolate.payments.length; i++) {
      if (gasleft() < MINIMUM_GAS_TO_PROCESS) {
        isolate.processed = i;
        return false;
      } else {
        forwardEscrow(isolate.payments[i], i);
      }
    }
    return true;
  }
  function processEscrowReturns(Isolate storage isolate) internal returns (bool) {
    if (!isolate.isProcessing) isolate.isProcessing = true;
    for (uint256 i = isolate.processed; i < isolate.payments.length; i++) {
      if (gasleft() < MINIMUM_GAS_TO_PROCESS) {
        isolate.processed = i;
        return false;
      } else {
        returnEscrow(isolate.payments[i], i);
      }
    }
    return true;
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
}
