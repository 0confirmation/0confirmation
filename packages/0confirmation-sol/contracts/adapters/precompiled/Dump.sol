pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ModuleLib } from "../lib/ModuleLib.sol";
import { DumpLib } from "./DumpLib.sol";

contract Dump {
  using ModuleLib for *;
  using DumpLib for *;
  function dump(address payable exchangeAddress, address payable target) public returns (bool) {
    return DumpLib.dumpImpl(exchangeAddress, target);
  }
  receive() external payable {
    // no-op
  }
  fallback() external payable {
    ModuleLib.AssetSubmodulePayload memory payload = msg.data.decodeAssetSubmodulePayload();
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    if (sig == Dump.dump.selector) {
      DumpLib.DumpInputs memory inputs = args.decodeDumpInputs();
      require(dump(inputs.exchangeAddress, inputs.target), "dump on uniswap failed");
    } else revert("unsupported contract call");
  }
}
