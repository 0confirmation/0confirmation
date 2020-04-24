pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Preprocessor } from "./lib/Preprocessor.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";
import { SandboxLib } from "../SandboxLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
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
  function execute(bytes memory input) public view returns (ShifterBorrowProxyLib.InitializationAction memory result) {
    SandboxLib.Context memory context = input.toContext();
    SandboxLib.ProtectedExecution memory execution = context.trace[context.trace.length - 1];
    (/* bytes4 sig */, bytes memory payload) = execution.txData.splitPayload();
    uint256 amount = decodeUniswapResult(execution.returnData);
    UniswapAdapterLib.TokenToTokenSwapInputInputs memory inputs = payload.decodeTokenToTokenSwapInputInputs();
    address destination = UniswapTradeAbsorb(context.preprocessorAddress).target();
    return ShifterBorrowProxyLib.InitializationAction({
      to: inputs.token_addr,
      txData: TokenUtils.encodeTransfer(destination, amount)
    });
  }
}
