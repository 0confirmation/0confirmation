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
  function getUniswapPayload(bytes memory input) internal pure returns (address preprocessorAddress, SandboxLib.ProtectedExecution memory execution, bytes memory args) {
    SandboxLib.Context memory context; //= input.toContext();
    (/* bool foundPrevious */, execution) = context.getLastExecution();
    preprocessorAddress = context.preprocessorAddress;
    (/* bytes4 sig */, args) = execution.txData.splitPayload();
  }
  struct UniswapTransaction {
    address token_addr;
    address destination;
    uint256 amount;
  }
  function getTarget(address preprocessorAddress) internal returns (address destination) {
    destination = UniswapTradeAbsorb(preprocessorAddress).target();
  }
  function computeTokenDestinationAndAmount(bytes memory input) internal returns (UniswapTransaction memory result) {
    (address preprocessorAddress, SandboxLib.ProtectedExecution memory execution, bytes memory payload) = getUniswapPayload(input);
    uint256 amount = decodeUniswapResult(execution.returnData);
    UniswapAdapterLib.TokenToTokenSwapInputInputs memory inputs = payload.decodeTokenToTokenSwapInputInputs();
    address destination = getTarget(preprocessorAddress);
    result.token_addr = inputs.token_addr;
    result.destination = destination;
    result.amount = amount;
  }
  function execute(bytes memory input) public returns (ShifterBorrowProxyLib.InitializationAction[] memory result) {
    UniswapTransaction memory transaction = computeTokenDestinationAndAmount(input);
    return address(uint160(transaction.token_addr))
      .sendTransaction(TokenUtils.encodeTransfer(transaction.destination, transaction.amount));
  }
}
