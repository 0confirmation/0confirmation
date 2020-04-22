pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Preprocessor } from "./lib/Preprocessor.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";
import { SandboxLib } from "../SandboxLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { IUniswapExchange } from "../interfaces/IUniswapExchange.sol";
import { TokenUtils } from "../utils/TokenUtils.sol";

contract UniswapTradeAbsorb is Preprocessor {
  using TokenUtils for *;
  address public target;
  constructor(address _target) public {
    target = _target;
  }
  function decodeUniswapResult(bytes memory input) internal pure returns (uint256 result) {
    (result) = abi.decode(input, (uint256));
  }
  function execute(bytes memory inputs) public returns (ShifterBorrowProxyLib.InitializationAction memory) {
    SandboxLib.Context memory context = inputs.toContext();
    SandboxLib.ProtectedExecution memory execution = context.trace[context.trace.length - 1];
    uint256 amount = decodeUniswapResult(execution.output.returnData);
    address token = IUniswapExchange(address(uint160(execution.input.to))).tokenAddress();
    return ShifterBorrowProxyLib.InitializationAction({
      to: token,
      txData: TokenUtils.encodeTransfer(target, amount)
    });
  }
}
