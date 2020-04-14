pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { SliceLib } from "../../utils/SliceLib.sol";

library ModuleLib {
  address payable constant ETHER_ADDRESS = 0x0000000000000000000000000000000000000000;
  function GET_ETHER_ADDRESS() internal pure returns (address payable) {
    return ETHER_ADDRESS;
  }
  function cast(uint256 v) internal pure returns (uint256) {
    return v;
  }
  function splitPayload(bytes memory payload) internal pure returns (bytes4 sig, bytes memory args) {
    sig = bytes4(uint32(uint256(SliceLib.asWord(SliceLib.toSlice(payload, 0, 4)))));
    args = SliceLib.copy(SliceLib.toSlice(payload, 4));
  }
  struct AssetSubmodulePayload {
    address payable moduleAddress;
    address liquidationSubmodule;
    address repaymentSubmodule;
    address payable txOrigin;
    address payable to;
    uint256 value;
    bytes callData;
  }
  function decodeAssetSubmodulePayload(bytes memory payload) internal pure returns (AssetSubmodulePayload memory) {
    (address payable moduleAddress, address liquidationSubmodule, address repaymentSubmodule, address payable txOrigin, address payable to, uint256 value, bytes memory callData) = abi.decode(payload, (address, address, address, address, address, uint256, bytes));
    return AssetSubmodulePayload({
      moduleAddress: moduleAddress,
      liquidationSubmodule: liquidationSubmodule,
      repaymentSubmodule: repaymentSubmodule,
      txOrigin: txOrigin,
      to: to,
      value: value,
      callData: callData
    });
  }
  function bubbleResult(bool success, bytes memory retval) internal pure {
    assembly {
      if iszero(success) {
        revert(add(0x20, retval), mload(retval))
      }
      return(add(0x20, retval), mload(retval))
    }
  }
}
