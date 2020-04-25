pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Preprocessor } from "./lib/Preprocessor.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";
import { SandboxLib } from "../utils/sandbox/SandboxLib.sol";
import { IUniswapExchange } from "../interfaces/IUniswapExchange.sol";
import { TokenUtils } from "../utils/TokenUtils.sol";
import { SliceLib } from "../utils/SliceLib.sol";
import { UniswapAdapterLib } from "../adapters/assets/uniswap/UniswapAdapterLib.sol";
import { ModuleLib } from "../adapters/lib/ModuleLib.sol";
import { PreprocessorLib } from "./lib/PreprocessorLib.sol";

contract UniswapTradeAbsorb {
  using TokenUtils for *;
  using SliceLib for *;
  using ModuleLib for *;
  using UniswapAdapterLib for *;
  using PreprocessorLib for *;
  address public target;
  constructor(address _target) public {
    target = _target;
  }
  function decodeUniswapResult(bytes memory input) internal pure returns (uint256 result) {
    (result) = abi.decode(input.toSlice(0, 0x20).copy(), (uint256));
  }
  function execute(bytes memory input) public view returns (ShifterBorrowProxyLib.InitializationAction[] memory result) {
    SandboxLib.Context memory context = input.toContext();
    (/* bool foundPrevious */, SandboxLib.ProtectedExecution memory execution) = context.getLastExecution();
    (/* bytes4 sig */, bytes memory payload) = execution.txData.splitPayload();
    uint256 amount = decodeUniswapResult(execution.returnData);
    UniswapAdapterLib.TokenToTokenSwapInputInputs memory inputs = payload.decodeTokenToTokenSwapInputInputs();
    address destination = UniswapTradeAbsorb(context.preprocessorAddress).target();
    return address(uint160(inputs.token_addr))
      .sendTransaction(TokenUtils.encodeTransfer(destination, amount));
  }
}
