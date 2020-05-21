pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ILiquidationModule } from "../../../interfaces/ILiquidationModule.sol";
import { IUniswapV2Pair } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";
import { UniswapV2AdapterLib } from "./UniswapV2AdapterLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";

contract UniswapV2Adapter {
  using TokenUtils for *;
  using ModuleLib for *;
  using BorrowProxyLib for *;
  using UniswapV2AdapterLib for *;
  constructor(address factoryAddress, uint256 liquidityMinimum) public {
    UniswapV2AdapterLib.ExternalIsolate storage isolate = UniswapV2AdapterLib.getIsolatePointer(address(this));
    isolate.factoryAddress = factoryAddress;
    isolate.liquidityMinimum = liquidityMinimum;
  }
  function getExternalIsolateHandler() external payable returns (UniswapV2AdapterLib.ExternalIsolate memory) {
    return UniswapV2AdapterLib.getIsolatePointer(address(this));
  }
  fallback() external payable {}
  receive() external payable {}
  function handle(ModuleLib.AssetSubmodulePayload memory payload) public payable {
    (/* IUniswapV2Factory factory */, address token0, address token1) = UniswapV2AdapterLib.validateExchange(payload.moduleAddress, payload.to);
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    
    if (sig == IUniswapV2Pair.swap.selector) {
      UniswapV2AdapterLib.SwapInputs memory inputs = args.decodeSwapInputs();
      if (address(this) != inputs.to) require(address(this) == inputs.to, "borrow proxy must be recipient of UniswapV2Pair#swap");
      require(token0.approveForMaxIfNeeded(payload.to) && token1.approveForMaxIfNeeded(payload.to), "failed to approve tokens");
      if (inputs.amount0Out > 0) require(payload.liquidationSubmodule.delegateNotify(token0.encodeLiquidationNotify()), "liquidation module notification failure");
      if (inputs.amount1Out > 0) require(payload.liquidationSubmodule.delegateNotify(token1.encodeLiquidationNotify()), "liquidation module notification failure");
      (bool success, bytes memory retval) = payload.to.call{ gas: gasleft(), value: payload.value }(payload.callData);
      ModuleLib.bubbleResult(success, retval);
    } else revert("unsupported contract call");
  }
}
