pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ILiquidationModule } from "../../../interfaces/ILiquidationModule.sol";
import { UniswapAdapterLib } from "./UniswapAdapterLib.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";
import { EtherForwarder } from "./EtherForwarder.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";

contract UniswapAdapter {
  using TokenUtils for *;
  using ModuleLib for *;
  using BorrowProxyLib for *;
  using UniswapAdapterLib for *;
  constructor(address factoryAddress) public {
    UniswapAdapterLib.ExternalIsolate storage isolate = UniswapAdapterLib.getIsolatePointer(address(this));
    isolate.factoryAddress = factoryAddress;
  }
  function getExternalIsolateHandler() external payable returns (UniswapAdapterLib.ExternalIsolate memory) {
    return UniswapAdapterLib.getIsolatePointer(address(this));
  }
  receive() payable external {
    // no impl
  }
  fallback() payable external {
    ModuleLib.AssetSubmodulePayload memory payload = msg.data.decodeAssetSubmodulePayload();
    (/* IUniswapFactory factory */, address tokenAddress) = UniswapAdapterLib.validateExchange(payload.moduleAddress, payload.to);
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    address newToken;
    bool usedForwarder = false;
    if (
      sig == IUniswapExchange.getInputPrice.selector ||
      sig == IUniswapExchange.getOutputPrice.selector ||
      sig == IUniswapExchange.getEthToTokenInputPrice.selector ||
      sig == IUniswapExchange.getEthToTokenOutputPrice.selector ||
      sig == IUniswapExchange.getTokenToEthInputPrice.selector ||
      sig == IUniswapExchange.getTokenToEthOutputPrice.selector || sig == IUniswapExchange.tokenAddress.selector ||
      sig == IUniswapExchange.addLiquidity.selector ||
      sig == IUniswapExchange.removeLiquidity.selector
    ) {}
    else if (sig == IUniswapExchange.ethToTokenSwapInput.selector) {
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
      (uint256 tokens_sold, uint256 min_eth, uint256 deadline) = abi.decode(args, (uint256,uint256,uint256));
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      payload.callData = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferInput.selector, tokens_sold, min_eth, deadline, UniswapAdapterLib.computeForwarderAddress());
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToEthSwapOutput.selector) {
      (uint256 eth_bought, uint256 max_tokens, uint256 deadline) = abi.decode(args, (uint256,uint256,uint256));
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      payload.callData = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferOutput.selector, eth_bought, max_tokens, deadline, UniswapAdapterLib.computeForwarderAddress());
      usedForwarder = true;
/*
    } else if (sig == IUniswapExchange.tokenToEthTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) = abi.decode(args, (uint256,uint256,uint256,address));
      require(recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      payload.callData = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferInput.selector, tokens_sold, min_eth, deadline, UniswapAdapterLib.computeForwarderAddress());
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToEthTransferOutput.selector) {
      (uint256 eth_bought, uint256 max_tokens, uint256 deadline, address recipient) = abi.decode(args, (uint256, uint256, uint256, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      payload.callData = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferOutput.selector, eth_bought, max_tokens, deadline, UniswapAdapterLib.computeForwarderAddress());
      usedForwarder = true;
*/
    } else if (sig == IUniswapExchange.tokenToTokenSwapInput.selector) {
      UniswapAdapterLib.TokenToTokenSwapInputInputs memory inputs = args.decodeTokenToTokenSwapInputInputs();
      if (inputs.tokens_sold > 0 || inputs.min_tokens_bought > 0 || inputs.min_eth_bought > 0) newToken = inputs.token_addr;
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
      newToken = address(uint160(inputs.token_addr));
      payload.callData = inputs.addRecipient(UniswapAdapterLib.computeForwarderAddress()).encodeTokenToTokenTransferInput();
      usedForwarder = true;
/*
    } else if (sig == IUniswapExchange.tokenToTokenTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
      require(recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenSwapOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0 && (max_tokens_sold > 0 || max_eth_sold > 0)) newToken = token_addr;
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenTransferOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_bought > 0 && (max_tokens_sold != 0 || max_eth_sold != 0)) newToken = token_addr;
      require(recipient != address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeTransferOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(payload.to), "approval of token failed");
*/
    } else revert("unsupported contract call");
    if (newToken != address(0x0)) require(payload.liquidationSubmodule.delegateNotify(abi.encode(newToken)), "liquidation module notification failure");
    (bool success, bytes memory retval) = payload.to.call{ gas: gasleft(), value: payload.value }(payload.callData);
    if (usedForwarder) UniswapAdapterLib.callForwarder(address(this), newToken);
    ModuleLib.bubbleResult(success, retval);
  }
}
