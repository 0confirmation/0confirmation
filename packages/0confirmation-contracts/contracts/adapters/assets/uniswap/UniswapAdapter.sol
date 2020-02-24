pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { ILiquidationModule } from "../../../interfaces/ILiquidationModule.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";
import { SliceLib } from "../../../utils/SliceLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../../../ShifterBorrowProxyLib.sol";

contract UniswapAdapter {
  using SliceLib for *;
  using BorrowProxyLib for *;
  using ShifterBorrowProxyLib for *;
  struct ExternalIsolate {
    address factoryAddress;
  }
  constructor(address factoryAddress) public {
    ExternalIsolate storage isolate = getIsolatePointer(factoryAddress);
    isolate.factoryAddress = factoryAddress;
  }
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.uniswap-adapter", instance)));
  }
  function cast(uint256 v) internal pure returns (uint256) {
    return v;
  }
  function toIsolatePointer(uint256 key) internal returns (ExternalIsolate storage) {
    function (uint256) internal returns (ExternalIsolate storage) swap;
    function (uint256) internal returns (uint256) real = cast;
    assembly {
      swap := real
    }
    return swap(key);
  }
  function getIsolatePointer(address instance) internal returns (ExternalIsolate storage) {
    return toIsolatePointer(computeIsolatePointer(instance));
  }
  function getExternalIsolateHandler() external payable returns (ExternalIsolate memory) {
    return getIsolatePointer(address(this));
  }
  function getExternalIsolate(address payable moduleAddress) internal returns (ExternalIsolate memory) {
    return UniswapAdapter(moduleAddress).getExternalIsolateHandler();
  }
  function getFactory(address payable moduleAddress) internal returns (IUniswapFactory) {
    return IUniswapFactory(getExternalIsolate(moduleAddress).factoryAddress);
  }
  function validateExchange(address payable moduleAddress, address to) internal returns (IUniswapFactory, address) {
    IUniswapFactory factory = getFactory(moduleAddress);
    address tokenAddress = factory.getToken(to);
    require(tokenAddress != address(0x0), "not a valid uniswap market");
    return (factory, tokenAddress);
  }
  function splitPayload(bytes memory payload) internal pure returns (bytes4 sig, bytes memory args) {
    sig = bytes4(payload.toSlice(0, 4).asWord());
    args = payload.toSlice(4).copy();
  }
  receive() payable external {
    (address payable moduleAddress, address liquidationModule, /* address txOrigin */, address to, uint256 value, bytes memory payload) = abi.decode(msg.data, (address, address, address, address, uint256, bytes));
    (/* IUniswapFactory factory */, address tokenAddress) = validateExchange(moduleAddress, to);
    (bytes4 sig, bytes memory args) = splitPayload(payload);
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
      require(recipient == address(this)); // "this" is the proxy wallet context
      if (min_tokens > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenSwapOutput.selector) {
      (uint256 tokens_bought, /* uint256 deadline */) = abi.decode(args, (uint256,uint256));
      if (tokens_bought > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.ethToTokenTransferOutput.selector) {
      (uint256 tokens_bought, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256,uint256,address));
      require(recipient == address(this));
      if (tokens_bought > 0) newToken = tokenAddress;
    } else if (sig == IUniswapExchange.tokenToEthTransferInput.selector) {
      (/* uint256 tokens_sold */, /* uint256 min_eth */, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256,uint256,uint256,address));
      require(recipient == address(this));
    } else if (sig == IUniswapExchange.tokenToEthTransferOutput.selector) {
      (/* uint256 eth_bought */, /* uint256 max_tokens */, /* uint256 deadline */, address recipient) = abi.decode(args, (uint256, uint256, uint256, address));
      require(recipient == address(this));
    } else if (sig == IUniswapExchange.tokenToTokenSwapInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, /* uint256 deadline */, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
    } else if (sig == IUniswapExchange.tokenToTokenTransferInput.selector) {
      (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, /* uint256 deadline */, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_sold > 0 || min_tokens_bought > 0 || min_eth_bought > 0) newToken = token_addr;
      require(recipient == address(this));
    } else if (sig == IUniswapExchange.tokenToTokenSwapOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, /* uint256 deadline */, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0 && (max_tokens_sold > 0 || max_eth_sold > 0)) newToken = token_addr;
    } else if (sig == IUniswapExchange.tokenToTokenTransferOutput.selector) {
      (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, /* uint256 deadline */, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      if (tokens_bought > 0 && (max_tokens_sold != 0 || max_eth_sold != 0)) newToken = token_addr;
      require(recipient != address(this));
    } else if (sig == IUniswapExchange.tokenToExchangeSwapInput.selector) {
      (uint256 tokens_sold, /* uint256 min_tokens_bought */, /* uint256 min_eth_bought */, /* uint256 deadline */, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else if (sig == IUniswapExchange.tokenToExchangeTransferInput.selector) {
      (uint256 tokens_sold, /* uint256 min_tokens_bought */, /* uint256 min_eth_bought */, /* uint256 deadline */, address recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this));
      if (tokens_sold > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else if (sig == IUniswapExchange.tokenToExchangeSwapOutput.selector) {
      (uint256 tokens_bought, /* uint256 max_tokens_sold */, /* uint256 max_eth_sold */, /* uint256 deadline */, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else if (sig == IUniswapExchange.tokenToExchangeTransferOutput.selector) {
      (uint256 tokens_bought, /* uint256 max_tokens_sold */, /* uint256 max_eth_sold */, /* uint256 deadline */, address payable recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
      require(recipient == address(this));
      if (tokens_bought > 0) newToken = IUniswapExchange(exchange_addr).tokenAddress();
    } else revert("unsupported contract call");
    if (newToken != address(0x0)) require(liquidationModule.delegateNotify(abi.encode(newToken)));
    (bool success, bytes memory retval) = to.call.value(value)(payload);
    if (success) assembly {
      return(add(0x20, retval), mload(retval))
    } else assembly {
      revert(add(0x20, retval), mload(retval))
    }
  }
}
