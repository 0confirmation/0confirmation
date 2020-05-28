pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ILiquidationModule } from "../../../interfaces/ILiquidationModule.sol";
import { UniswapAdapterLib } from "./UniswapAdapterLib.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";
import { AssetForwarder } from "../../lib/AssetForwarder.sol";
import { AssetForwarderLib } from "../../lib/AssetForwarderLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";

contract UniswapAdapter {
  using TokenUtils for *;
  using ModuleLib for *;
  using BorrowProxyLib for *;
  using UniswapAdapterLib for *;
  constructor(address factoryAddress, uint256 liquidityMinimum) public {
    UniswapAdapterLib.ExternalIsolate storage isolate = UniswapAdapterLib.getIsolatePointer(address(this));
    isolate.factoryAddress = factoryAddress;
    isolate.liquidityMinimum = liquidityMinimum;
    isolate.assetForwarderImplementation = AssetForwarderLib.deployAssetForwarder();
  }
  function getExternalIsolateHandler() external payable returns (UniswapAdapterLib.ExternalIsolate memory) {
    return UniswapAdapterLib.getIsolatePointer(address(this));
  }
  fallback() external payable {}
  receive() external payable {}
  function handle(ModuleLib.AssetSubmodulePayload memory payload) public payable {
    (/* IUniswapFactory factory */, address tokenAddress) = UniswapAdapterLib.validateExchange(payload.moduleAddress, payload.to);
    UniswapAdapterLib.ExternalIsolate memory isolate = UniswapAdapter(payload.moduleAddress).getExternalIsolateHandler();
    if (payload.to.balance < isolate.liquidityMinimum) revert("exchange liquidity is below threshold");
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    address newToken;
    bool usedForwarder = false;
    if (sig == IUniswapExchange.ethToTokenSwapInput.selector) {
      UniswapAdapterLib.EthToTokenSwapInputInputs memory inputs = args.decodeEthToTokenSwapInputInputs();
      if (inputs.min_tokens > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenTransferInput.selector) {
      UniswapAdapterLib.EthToTokenTransferInputInputs memory inputs = args.decodeEthToTokenTransferInputInputs();
      require(inputs.recipient == address(this), "recipient must be borrow proxy"); // "this" is the proxy wallet context
      if (inputs.min_tokens > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenSwapOutput.selector) {
      UniswapAdapterLib.EthToTokenSwapOutputInputs memory inputs = args.decodeEthToTokenSwapOutputInputs();
      if (inputs.tokens_bought > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenTransferOutput.selector) {
      UniswapAdapterLib.EthToTokenTransferOutputInputs memory inputs = args.decodeEthToTokenTransferOutputInputs();
      require(inputs.recipient == address(this), "recipient must be borrow proxy");
      if (inputs.tokens_bought > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.tokenToEthSwapInput.selector) {
      UniswapAdapterLib.TokenToEthSwapInputInputs memory inputs = args.decodeTokenToEthSwapInputInputs();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      payload.callData = inputs.addRecipient(UniswapAdapterLib.computeForwarderAddress(payload.moduleAddress)).encodeWithSelector();
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToEthSwapOutput.selector) {
      UniswapAdapterLib.TokenToEthSwapOutputInputs memory inputs = args.decodeTokenToEthSwapOutputInputs();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      payload.callData = inputs.addRecipient(UniswapAdapterLib.computeForwarderAddress(payload.moduleAddress)).encodeWithSelector();
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToEthTransferInput.selector) {
      UniswapAdapterLib.TokenToEthTransferInputInputs memory inputs = args.decodeTokenToEthTransferInputInputs();
      require(inputs.recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      inputs.recipient = UniswapAdapterLib.computeForwarderAddress(payload.moduleAddress);
      payload.callData = inputs.encodeWithSelector();
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToEthTransferOutput.selector) {
      UniswapAdapterLib.TokenToEthTransferOutputInputs memory inputs = args.decodeTokenToEthTransferOutputInputs();
      require(inputs.recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      inputs.recipient = UniswapAdapterLib.computeForwarderAddress(payload.moduleAddress);
      payload.callData = inputs.encodeWithSelector();
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToTokenSwapInput.selector) {
      UniswapAdapterLib.TokenToTokenSwapInputInputs memory inputs = args.decodeTokenToTokenSwapInputInputs();
      if (inputs.tokens_sold > 0 || inputs.min_tokens_bought > 0 || inputs.min_eth_bought > 0) newToken = inputs.token_addr;
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      newToken = address(uint160(inputs.token_addr));
      payload.callData = inputs.addRecipient(UniswapAdapterLib.computeForwarderAddress(payload.moduleAddress)).encodeTokenToTokenTransferInput();
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToTokenTransferInput.selector) {
      UniswapAdapterLib.TokenToTokenTransferInputInputs memory inputs = args.decodeTokenToTokenTransferInputInputs();
      if (inputs.tokens_sold > 0 || inputs.min_tokens_bought > 0 || inputs.min_eth_bought > 0) newToken = inputs.token_addr;
      require(inputs.recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenSwapOutput.selector) {
      UniswapAdapterLib.TokenToTokenSwapOutputInputs memory inputs = args.decodeTokenToTokenSwapOutputInputs();
      if (inputs.tokens_bought > 0 && (inputs.max_tokens_sold > 0 || inputs.max_eth_sold > 0)) newToken = inputs.token_addr;
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenTransferOutput.selector) {
      UniswapAdapterLib.TokenToTokenTransferOutputInputs memory inputs = args.decodeTokenToTokenTransferOutputInputs();
      if (inputs.tokens_bought > 0 && (inputs.max_tokens_sold != 0 || inputs.max_eth_sold != 0)) newToken = inputs.token_addr;
      require(inputs.recipient != address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapInput.selector) {
      UniswapAdapterLib.TokenToExchangeSwapInputInputs memory inputs = args.decodeTokenToExchangeSwapInputInputs();
      if (inputs.tokens_sold > 0) newToken = IUniswapExchange(inputs.exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeTransferInput.selector) {
      UniswapAdapterLib.TokenToExchangeTransferInputInputs memory inputs = args.decodeTokenToExchangeTransferInputInputs();
      require(inputs.recipient == address(this), "recipient must be borrow proxy");
      if (inputs.tokens_sold > 0) newToken = IUniswapExchange(inputs.exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapOutput.selector) {
      UniswapAdapterLib.TokenToExchangeSwapOutputInputs memory inputs = args.decodeTokenToExchangeSwapOutputInputs();
      if (inputs.tokens_bought > 0) newToken = IUniswapExchange(inputs.exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeTransferOutput.selector) {
      UniswapAdapterLib.TokenToExchangeTransferOutputInputs memory inputs = args.decodeTokenToExchangeTransferOutputInputs();
      require(inputs.recipient == address(this), "recipient must be borrow proxy");
      if (inputs.tokens_bought > 0) newToken = IUniswapExchange(inputs.exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.addLiquidity.selector) {
      newToken = payload.to;
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.removeLiquidity.selector) {
      // this stub exists but the transaction will always revert since removeLiquidity cannot send to contracts .. or can it?
      newToken = IUniswapExchange(payload.to).tokenAddress();
    } else revert("unsupported contract call");
    if (newToken != address(0x0)) require(payload.liquidationSubmodule.delegateNotify(newToken.encodeLiquidationNotify()), "liquidation module notification failure");
    (bool success, bytes memory retval) = payload.to.call{ gas: gasleft(), value: payload.value }(payload.callData);
    if (usedForwarder) UniswapAdapterLib.callForwarder(payload.moduleAddress, address(this), address(uint160(newToken)));
    ModuleLib.bubbleResult(success, retval);
  }
}