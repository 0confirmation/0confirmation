pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { IUniswapV2Router01 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";
import { UniswapV2AdapterLib } from "./UniswapV2AdapterLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ERC20AdapterLib } from "../erc20/ERC20AdapterLib.sol";

contract UniswapV2Adapter {
  using TokenUtils for *;
  using ModuleLib for *;
  using BorrowProxyLib for *;
  using UniswapV2AdapterLib for *;
  using ERC20AdapterLib for *;
  BorrowProxyLib.ProxyIsolate proxyIsolate;
  constructor(address erc20Module, uint256 liquidityMinimum) public {
    UniswapV2AdapterLib.Isolate storage isolate = UniswapV2AdapterLib.getIsolatePointer(address(this));
    isolate.erc20Module = erc20Module;
    isolate.liquidityMinimum = liquidityMinimum;
  }
  function getExternalIsolateHandler() external payable returns (UniswapV2AdapterLib.Isolate memory) {
    return UniswapV2AdapterLib.getIsolatePointer(address(this));
  }
  function handle(ModuleLib.AssetSubmodulePayload memory payload) public payable {
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    bool shouldTriggerERC20Handlers = false;
    address newToken = address(0x0);
    address startToken = address(0x0);
    if (sig == IUniswapV2Router01.swapExactTokensForTokens.selector) {
      UniswapV2AdapterLib.SwapExactTokensForTokensInputs memory inputs = args.decodeSwapExactTokensForTokensInputs();
      address WETH = IUniswapV2Router01(payload.to).WETH();
      (startToken, newToken) = inputs.path.validatePath(WETH);
      if (inputs.to != address(this)) {
        address escrowWallet = proxyIsolate.deriveNextForwarderAddress();
        payload.callData = inputs.changeRecipient(escrowWallet).encodeWithSelector();
        shouldTriggerERC20Handlers = true;
        ERC20AdapterLib.installEscrowRecord(inputs.to, newToken);
      }
    } else if (sig == IUniswapV2Router01.swapTokensForExactTokens.selector) {
      UniswapV2AdapterLib.SwapTokensForExactTokensInputs memory inputs = args.decodeSwapTokensForExactTokensInputs();
      address WETH = IUniswapV2Router01(payload.to).WETH();
      (startToken, newToken) = inputs.path.validatePath(WETH);
      if (inputs.to != address(this)) {
        address escrowWallet = proxyIsolate.deriveNextForwarderAddress();
        payload.callData = inputs.changeRecipient(escrowWallet).encodeWithSelector();
        shouldTriggerERC20Handlers = true;
        ERC20AdapterLib.installEscrowRecord(inputs.to, newToken);
      }
    } else if (sig == IUniswapV2Router01.swapExactETHForTokens.selector) {
      UniswapV2AdapterLib.SwapExactETHForTokensInputs memory inputs = args.decodeSwapExactETHForTokensInputs();
      address WETH = IUniswapV2Router01(payload.to).WETH();
      (startToken, newToken) = inputs.path.validatePath(WETH);
      if (inputs.to != address(this)) {
        address escrowWallet = proxyIsolate.deriveNextForwarderAddress();
        payload.callData = inputs.changeRecipient(escrowWallet).encodeWithSelector();
        shouldTriggerERC20Handlers = true;
        ERC20AdapterLib.installEscrowRecord(inputs.to, newToken);
      }
    } else if (sig == IUniswapV2Router01.swapTokensForExactETH.selector) {
      UniswapV2AdapterLib.SwapExactETHForTokensInputs memory inputs = args.decodeSwapExactETHForTokensInputs();
      address WETH = IUniswapV2Router01(payload.to).WETH();
      (startToken, newToken) = inputs.path.validatePath(WETH);
      if (inputs.to != address(this)) {
        address escrowWallet = proxyIsolate.deriveNextForwarderAddress();
        payload.callData = inputs.changeRecipient(escrowWallet).encodeWithSelector();
        shouldTriggerERC20Handlers = true;
        ERC20AdapterLib.installEscrowRecord(inputs.to, newToken);
      }
    } else if (sig == IUniswapV2Router01.swapExactTokensForETH.selector) {
      UniswapV2AdapterLib.SwapExactTokensForETHInputs memory inputs = args.decodeSwapExactTokensForETHInputs();
      address WETH = IUniswapV2Router01(payload.to).WETH();
      (startToken, newToken) = inputs.path.validatePath(WETH);
      if (inputs.to != address(this)) {
        address escrowWallet = proxyIsolate.deriveNextForwarderAddress();
        payload.callData = inputs.changeRecipient(escrowWallet).encodeWithSelector();
        shouldTriggerERC20Handlers = true;
        ERC20AdapterLib.installEscrowRecord(inputs.to, newToken);
      }
    } else if (sig == IUniswapV2Router01.swapETHForExactTokens.selector) {
      UniswapV2AdapterLib.SwapETHForExactTokensInputs memory inputs = args.decodeSwapETHForExactTokensInputs();
      address WETH = IUniswapV2Router01(payload.to).WETH();
      (startToken, newToken) = inputs.path.validatePath(WETH);
      if (inputs.to != address(this)) {
        address escrowWallet = proxyIsolate.deriveNextForwarderAddress();
        payload.callData = inputs.changeRecipient(escrowWallet).encodeWithSelector();
        shouldTriggerERC20Handlers = true;
        ERC20AdapterLib.installEscrowRecord(inputs.to, newToken);
      }
    } else revert("unsupported contract call");
    if (newToken != address(0x0)) require(payload.liquidationSubmodule.delegateNotify(newToken.encodeLiquidationNotify()), "liquidation module notification failure");
    require(startToken.approveForMaxIfNeeded(payload.to), "failed to approve start token");
    if (shouldTriggerERC20Handlers) proxyIsolate.triggerERC20Handlers(payload.moduleAddress);
    (bool success, bytes memory retval) = payload.to.call{ gas: gasleft(), value: payload.value }(payload.callData);
    ModuleLib.bubbleResult(success, retval);
  }
}
