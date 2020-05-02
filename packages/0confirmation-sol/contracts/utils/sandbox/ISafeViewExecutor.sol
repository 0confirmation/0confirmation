pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { SafeViewLib } from "./SafeViewLib.sol";

contract ISafeViewExecutor {
  function query(bytes memory /* creationCode */, bytes memory /* context */) public view returns (SafeViewLib.SafeViewResult memory) {
   // stub
  }
}
