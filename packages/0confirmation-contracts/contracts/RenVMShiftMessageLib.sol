pragma solidity ^0.6.2;

import { BorrowProxy } from "./BorrowProxy.sol";

library RenVMShiftMessageLib {
  struct RenVMShiftMessage {
    bytes32 pHash;
    uint256 amount;
    bytes32 nHash;
  }
  function computeBorrowerSalt(RenVMShiftMessage memory message, address token) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(token, message.pHash, message.amount, message.nHash));
  }
  function computeShifterHash(RenVMShiftMessage memory message, address token, address to) internal pure returns (bytes32) {
    return keccak256(abi.encode(message.pHash, message.amount, token, to, message.nHash));
  }
}
