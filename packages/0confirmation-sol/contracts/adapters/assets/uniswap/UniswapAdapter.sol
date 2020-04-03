pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ILiquidationModule } from "../../../interfaces/ILiquidationModule.sol";
import { UniswapAdapterLib } from "./UniswapAdapterLib.sol";
import { SliceLib } from "../../../utils/SliceLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../../../ShifterBorrowProxyLib.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";

contract UniswapAdapter {
  using SliceLib for *;
  using BorrowProxyLib for *;
  using ShifterBorrowProxyLib for *;
  using UniswapAdapterLib for *;
  constructor(address factoryAddress) public {
    UniswapAdapterLib.ExternalIsolate storage isolate = UniswapAdapterLib.getIsolatePointer(factoryAddress);
    isolate.factoryAddress = factoryAddress;
  }
  function getExternalIsolateHandler() external payable returns (UniswapAdapterLib.ExternalIsolate memory) {
    return UniswapAdapterLib.getIsolatePointer(address(this));
  }
  function getSignatures() public pure returns (bytes4[] memory retval) {
    retval = new bytes4[](25);
    retval[0] = IUniswapExchange.getInputPrice.selector;
    retval[1] = IUniswapExchange.getOutputPrice.selector;
    retval[2] = IUniswapExchange.tokenToEthSwapInput.selector;
    retval[3] = IUniswapExchange.tokenToEthSwapOutput.selector;
    retval[4] = IUniswapExchange.getEthToTokenInputPrice.selector;
    retval[5] = IUniswapExchange.getEthToTokenOutputPrice.selector;
    retval[6] = IUniswapExchange.getTokenToEthInputPrice.selector;
    retval[7] = IUniswapExchange.getTokenToEthOutputPrice.selector;
    retval[8] = IUniswapExchange.tokenAddress.selector;
    retval[9] = IUniswapExchange.addLiquidity.selector;
    retval[10] = IUniswapExchange.removeLiquidity.selector;
    retval[11] = IUniswapExchange.ethToTokenSwapInput.selector;
    retval[12] = IUniswapExchange.ethToTokenTransferInput.selector;
    retval[13] = IUniswapExchange.ethToTokenSwapOutput.selector;
    retval[14] = IUniswapExchange.ethToTokenTransferOutput.selector;
    retval[15] = IUniswapExchange.tokenToEthTransferInput.selector;
    retval[16] = IUniswapExchange.tokenToEthTransferOutput.selector;
    retval[17] = IUniswapExchange.tokenToTokenSwapInput.selector;
    retval[18] = IUniswapExchange.tokenToTokenTransferInput.selector;
    retval[19] = IUniswapExchange.tokenToTokenSwapOutput.selector;
    retval[20] = IUniswapExchange.tokenToTokenTransferOutput.selector;
    retval[21] = IUniswapExchange.tokenToExchangeSwapInput.selector;
    retval[22] = IUniswapExchange.tokenToExchangeTransferInput.selector;
    retval[23] = IUniswapExchange.tokenToExchangeSwapOutput.selector;
    retval[24] = IUniswapExchange.tokenToExchangeTransferOutput.selector;
  }
  receive() payable external {
    // no impl
  }
  fallback() payable external {
    (address payable moduleAddress, address liquidationModule, /* address txOrigin */, address to, uint256 value, bytes memory payload) = abi.decode(msg.data, (address, address, address, address, uint256, bytes));
    (/* IUniswapFactory factory */, address tokenAddress) = UniswapAdapterLib.validateExchange(moduleAddress, to);
    (bytes4 sig, bytes memory args) = payload.splitPayload();
    address newToken;
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
      (/* uint256 tokens_sold */, /* uint256 min_eth */, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256,uint256,uint256,address));
      uint256 approved = tokenAddress.getApproved(address(this), to);
      if (approved == 0) require(tokenAddress.approveToken(to, uint256(~0)), "approve failed");
      require(recipient == address(this), "recipient must be borrow proxy");
    } else if (sig == IUniswapExchange.tokenToEthTransferOutput.selector) {
      (/* uint256 eth_bought */, /* uint256 max_tokens */, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256, uint256, uint256, address));
      require(recipient == address(this), "recipient must be borrow proxy");
    } else if (sig == IUniswapExchange.tokenToTokenSwapInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, /* uint256 deadline */, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
    } else if (sig == IUniswapExchange.tokenToTokenTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, /* uint256 deadline */, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
      require(recipient == address(this), "recipient must be borrow proxy");
    } else if (sig == IUniswapExchange.tokenToTokenSwapOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, /* uint256 deadline */, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0 && (max_tokens_sold > 0 || max_eth_sold > 0)) newToken = token_addr;
    } else if (sig == IUniswapExchange.tokenToTokenTransferOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, /* uint256 deadline */, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_bought > 0 && (max_tokens_sold != 0 || max_eth_sold != 0)) newToken = token_addr;
      require(recipient != address(this), "recipient must be borrow proxy");
    } else if (sig == IUniswapExchange.tokenToExchangeSwapInput.selector) {
      (uint256 tokens_sold, /* uint256 min_tokens_bought */, /* uint256 min_eth_bought */, /* uint256 deadline */, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else if (sig == IUniswapExchange.tokenToExchangeTransferInput.selector) {
      (uint256 tokens_sold, /* uint256 min_tokens_bought */, /* uint256 min_eth_bought */, /* uint256 deadline */, address recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else if (sig == IUniswapExchange.tokenToExchangeSwapOutput.selector) {
      (uint256 tokens_bought, /* uint256 max_tokens_sold */, /* uint256 max_eth_sold */, /* uint256 deadline */, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else if (sig == IUniswapExchange.tokenToExchangeTransferOutput.selector) {
      (uint256 tokens_bought, /* uint256 max_tokens_sold */, /* uint256 max_eth_sold */, /* uint256 deadline */, address payable recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this), "recipient must be borrow proxy");
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else revert("unsupported contract call");
    if (newToken != address(0x0)) require(liquidationModule.delegateNotify(abi.encode(newToken)), "liquidation module notification failure");
    (bool success, bytes memory retval) = to.call.value(value)(payload);
    if (success) assembly {
      return(add(0x20, retval), mload(retval))
    } else assembly {
      revert(add(0x20, retval), mload(retval))
    }
  }
}
