pragma solidity ^0.6.0;

import { SandboxLib } from "../../SandboxLib.sol";

library PreprocessorLib {
  function toContext(bytes memory input) internal pure returns (SandboxLib.Context memory) {
    return SandboxLib.toContext(input);
  }
}
