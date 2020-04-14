pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { ModuleLib } from "../lib/ModuleLib.sol";
import { AbsorbLib } from "./AbsorbLib.sol";

contract Absorb {
  using ModuleLib for *;
  using AbsorbLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  receive() external payable {
    // no-op
  }
  struct AbsorbInputs {
    address payable target;
  }
  function decodeAbsorbInputs(bytes memory args) internal pure returns (AbsorbInputs memory) {
    (address payable target) = abi.decode(args, (address));
    return AbsorbInputs({
      target: target
    });
  }
  function absorb(address payable target) public returns (bool) {
    return target.absorbImpl();
  }
  fallback() external payable {
    ModuleLib.AssetSubmodulePayload memory payload = msg.data.decodeAssetSubmodulePayload();
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    if (sig == Absorb.absorb.selector) {
      AbsorbInputs memory inputs = decodeAbsorbInputs(args);  
      require(absorb(target), "absorb failed");
    } else revert("unsupported contract call");
  }
}
