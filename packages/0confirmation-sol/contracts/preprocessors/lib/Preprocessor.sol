// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { PreprocessorLib } from "./PreprocessorLib.sol";

contract Preprocessor {
  using PreprocessorLib for *;
  function destroy() external {
    selfdestruct(msg.sender);
  }
}
