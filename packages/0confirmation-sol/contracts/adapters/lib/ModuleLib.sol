pragma solidity ^0.6.0;

import { SliceLib } from "../../utils/SliceLib.sol";

library ModuleLib {
  function cast(uint256 v) internal pure returns (uint256) {
    return v;
  }
  function splitPayload(bytes memory payload) internal pure returns (bytes4 sig, bytes memory args) {
    sig = bytes4(uint32(uint256(SliceLib.asWord(SliceLib.toSlice(payload, 0, 4)))));
    args = SliceLib.copy(SliceLib.toSlice(payload, 4));
  }
}
