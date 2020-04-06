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
    (address payable moduleAddress, address liquidationSubmodule, /* address repaymentSubmodule */, /* address txOrigin */, address to, uint256 value, bytes memory payload) = abi.decode(msg.data, (address, address, address, address, address, uint256, bytes));
    (/* IUniswapFactory factory */, address tokenAddress) = UniswapAdapterLib.validateExchange(moduleAddress, to);
    (bytes4 sig, bytes memory args) = payload.splitPayload();
    address newToken;
    bool usedForwarder = false;
    if (
      sig == IUniswapExchange.getInputPrice.selector ||
      sig == IUniswapExchange.getOutputPrice.selector ||
      sig == IUniswapExchange.tokenToEthSwapInput.selector ||
      sig == IUniswapExchange.tokenToEthSwapOutput.selector ||
      sig == IUniswapExchange.getEthToTokenInputPrice.selector ||
      sig == IUniswapExchange.getEthToTokenOutputPrice.selector ||
      sig == IUniswapExchange.getTokenToEthInputPrice.selector ||
      sig == IUniswapExchange.getTokenToEthOutputPrice.selector ||
      sig == IUniswapExchange.tokenAddress.selector ||
      sig == IUniswapExchange.addLiquidity.selector ||
      sig == IUniswapExchange.removeLiquidity.selector
    ) {}
    else if (sig == IUniswapExchange.ethToTokenSwapInput.selector) {
      (uint256 min_tokens, /* uint256 deadline */) = abi.decode(args, (uint256,uint256));
      if (min_tokens > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenTransferInput.selector) {
      (uint256 min_tokens, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256,uint256,address));
      require(recipient == address(this), "recipient must be borrow proxy"); // "this" is the proxy wallet context
      if (min_tokens > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenSwapOutput.selector) {
      (uint256 tokens_bought, /* uint256 deadline */) = abi.decode(args, (uint256,uint256));
      if (tokens_bought > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenTransferOutput.selector) {
      (uint256 tokens_bought, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256,uint256,address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_bought > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.tokenToEthTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_eth, uint256 deadline, address recipient) = abi.decode(args, (uint256,uint256,uint256,address));
      require(recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
      payload = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferInput.selector, tokens_sold, min_eth, deadline, UniswapAdapterLib.computeForwarderAddress());
      usedForwarder = true;
    } else if (sig == IUniswapExchange.tokenToEthTransferOutput.selector) {
      (/* uint256 eth_bought */, /* uint256 max_tokens */, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256, uint256, uint256, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenSwapInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, /* uint256 deadline */, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, /* uint256 deadline */, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
      require(recipient == address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenSwapOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, /* uint256 deadline */, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0 && (max_tokens_sold > 0 || max_eth_sold > 0)) newToken = token_addr;
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToTokenTransferOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, /* uint256 deadline */, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_bought > 0 && (max_tokens_sold != 0 || max_eth_sold != 0)) newToken = token_addr;
      require(recipient != address(this), "recipient must be borrow proxy");
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapInput.selector) {
      (uint256 tokens_sold, /* uint256 min_tokens_bought */, /* uint256 min_eth_bought */, /* uint256 deadline */, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeTransferInput.selector) {
      (uint256 tokens_sold, /* uint256 min_tokens_bought */, /* uint256 min_eth_bought */, /* uint256 deadline */, address recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapOutput.selector) {
      (uint256 tokens_bought, /* uint256 max_tokens_sold */, /* uint256 max_eth_sold */, /* uint256 deadline */, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else if (sig == IUniswapExchange.tokenToExchangeTransferOutput.selector) {
      (uint256 tokens_bought, /* uint256 max_tokens_sold */, /* uint256 max_eth_sold */, /* uint256 deadline */, address payable recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
      require(tokenAddress.approveForMaxIfNeeded(to), "approval of token failed");
    } else revert("unsupported contract call");
    if (newToken != address(0x0)) require(liquidationSubmodule.delegateNotify(abi.encode(newToken)), "liquidation module notification failure");
    (bool success, bytes memory retval) = to.call.value(value).gas(gasleft())(payload);
    if (!success) revert("break it on purpose");
    if (usedForwarder) UniswapAdapterLib.callForwarder(address(this));
    if (success) assembly {
      return(add(0x20, retval), mload(retval))
    } else assembly {
      revert(add(0x20, retval), mload(retval))
    }
  }
}
