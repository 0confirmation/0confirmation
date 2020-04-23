pragma solidity ^0.6.0;

import { UniswapAdapter } from "./UniswapAdapter.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../../../ShifterBorrowProxyLib.sol";
import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";
import { AssetForwarder } from "../../lib/AssetForwarder.sol";

library UniswapAdapterLib {
  using BorrowProxyLib for *;
  using ShifterBorrowProxyLib for *;
  bytes32 constant ETHER_FORWARDER_SALT = 0x3e8d8e49b9a35f50b96f6ba4b93e0fc6c1d66a2e1c04975ef848d7031c8158a4; // keccak("uniswap-adapter.ether-forwarder")
  struct ExternalIsolate {
    address factoryAddress;
  }
  struct TokenToTokenSwapInputInputs {
    uint256 tokens_sold;
    uint256 min_tokens_bought;
    uint256 min_eth_bought;
    uint256 deadline;
    address payable token_addr;
  }
  struct TokenToTokenTransferInputInputs {
    uint256 tokens_sold;
    uint256 min_tokens_bought;
    uint256 min_eth_bought;
    uint256 deadline;
    address recipient;
    address payable token_addr;
  }
  function decodeTokenToTokenTransferInputInputs(bytes memory args) internal pure returns (TokenToTokenTransferInputInputs memory) {
    (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
    return TokenToTokenTransferInputInputs({
      tokens_sold: tokens_sold,
      min_tokens_bought: min_tokens_bought,
      min_eth_bought: min_eth_bought,
      deadline: deadline,
      recipient: recipient,
      token_addr: token_addr
    });
  }
  function addRecipient(TokenToTokenSwapInputInputs memory input, address payable recipient) internal pure returns (TokenToTokenTransferInputInputs memory) {
    return TokenToTokenTransferInputInputs({
      tokens_sold: input.tokens_sold,
      min_tokens_bought: input.min_tokens_bought,
      min_eth_bought: input.min_eth_bought,
      deadline: input.deadline,
      recipient: recipient,
      token_addr: input.token_addr
    });
  }
  function encodeTokenToTokenTransferInput(TokenToTokenTransferInputInputs memory input) internal pure returns (bytes memory result) {
    result = abi.encodeWithSelector(IUniswapExchange.tokenToTokenTransferInput.selector, input.tokens_sold, input.min_tokens_bought, input.min_eth_bought, input.deadline, input.recipient, input.token_addr);
  }
  function decodeTokenToTokenSwapInputInputs(bytes memory args) internal pure returns (TokenToTokenSwapInputInputs memory) {
    (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
    return TokenToTokenSwapInputInputs({
      tokens_sold: tokens_sold,
      min_tokens_bought: min_tokens_bought,
      min_eth_bought: min_eth_bought,
      deadline: deadline,
      token_addr: token_addr
    });
  }
  struct EthToTokenSwapInputInputs {
    uint256 min_tokens;
    uint256 deadline;
  }
  function decodeEthToTokenSwapInputInputs(bytes memory args) internal pure returns (EthToTokenSwapInputInputs memory) {
    (uint256 min_tokens, uint256 deadline) = abi.decode(args, (uint256,uint256));
    return EthToTokenSwapInputInputs({
      min_tokens: min_tokens,
      deadline: deadline
    });
  }
  struct EthToTokenTransferInputInputs {
    uint256 min_tokens;
    uint256 deadline;
    address recipient;
  }
  function decodeEthToTokenTransferInputInputs(bytes memory args) internal pure returns (EthToTokenTransferInputInputs memory) {
    (uint256 min_tokens, uint256 deadline, address recipient) = abi.decode(args, (uint256,uint256,address));
    return EthToTokenTransferInputInputs({
      min_tokens: min_tokens,
      deadline: deadline,
      recipient: recipient
    });
  }
  struct EthToTokenSwapOutputInputs {
    uint256 tokens_bought;
    uint256 deadline;
  }
  function decodeEthToTokenSwapOutputInputs(bytes memory args) internal pure returns (EthToTokenSwapOutputInputs memory) {
    (uint256 tokens_bought, uint256 deadline) = abi.decode(args, (uint256,uint256));
    return EthToTokenSwapOutputInputs({
      tokens_bought: tokens_bought,
      deadline: deadline
    });
  }
  struct EthToTokenTransferOutputInputs {
    uint256 tokens_bought;
    uint256 deadline;
    address recipient;
  }
  function decodeEthToTokenTransferOutputInputs(bytes memory args) internal pure returns (EthToTokenTransferOutputInputs memory) {
    (uint256 tokens_bought, uint256 deadline, address recipient) = abi.decode(args, (uint256,uint256,address));
    return EthToTokenTransferOutputInputs({
      tokens_bought: tokens_bought,
      deadline: deadline,
      recipient: recipient
    });
  }
  struct TokenToEthSwapInputInputs {
    uint256 tokens_sold;
    uint256 min_eth;
    uint256 deadline;
  }
  function addRecipient(TokenToEthSwapInputInputs memory args, address payable recipient) internal pure returns (TokenToEthTransferInputInputs memory) {
    return TokenToEthTransferInputInputs({
      tokens_sold: args.tokens_sold,
      min_eth: args.min_eth,
      deadline: args.deadline,
      recipient: recipient
    });
  }
  function encodeWithSelector(TokenToEthTransferInputInputs memory args) internal pure returns (bytes memory result) {
    result = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferInput.selector, args.tokens_sold, args.min_eth, args.deadline, args.recipient);
  }
  function decodeTokenToEthSwapInputInputs(bytes memory args) internal pure returns (TokenToEthSwapInputInputs memory) {
    (uint256 tokens_sold, uint256 min_eth, uint256 deadline) = abi.decode(args, (uint256,uint256,uint256));
    return TokenToEthSwapInputInputs({
      tokens_sold: tokens_sold,
      min_eth: min_eth,
      deadline: deadline
    });
  }
  struct TokenToEthSwapOutputInputs {
    uint256 eth_bought;
    uint256 max_tokens;
    uint256 deadline;
  }
  function addRecipient(TokenToEthSwapOutputInputs memory args, address payable recipient) internal pure returns (TokenToEthTransferOutputInputs memory) {
    return TokenToEthTransferOutputInputs({
      eth_bought: args.eth_bought,
      max_tokens: args.max_tokens,
      deadline: args.deadline,
      recipient: recipient
    });
  }
  function encodeWithSelector(TokenToEthTransferOutputInputs memory args) internal pure returns (bytes memory result) {
    result = abi.encodeWithSelector(IUniswapExchange.tokenToEthTransferOutput.selector, args.eth_bought, args.max_tokens, args.deadline, args.recipient);
  }
  function decodeTokenToEthSwapOutputInputs(bytes memory args) internal pure returns (TokenToEthSwapOutputInputs memory) {
    (uint256 eth_bought, uint256 max_tokens, uint256 deadline) = abi.decode(args, (uint256,uint256,uint256));
    return TokenToEthSwapOutputInputs({
      eth_bought: eth_bought,
      max_tokens: max_tokens,
      deadline: deadline
    });
  }
  struct TokenToEthTransferInputInputs {
    uint256 tokens_sold;
    uint256 min_eth;
    uint256 deadline;
    address payable recipient;
  }
  function decodeTokenToEthTransferInputInputs(bytes memory args) internal pure returns (TokenToEthTransferInputInputs memory) {
    (uint256 tokens_sold, uint256 min_eth, uint256 deadline, address payable recipient) = abi.decode(args, (uint256,uint256,uint256,address));
    return TokenToEthTransferInputInputs({
      tokens_sold: tokens_sold,
      min_eth: min_eth,
      deadline: deadline,
      recipient: recipient
    });
  }
  struct TokenToEthTransferOutputInputs {
    uint256 eth_bought;
    uint256 max_tokens;
    uint256 deadline;
    address payable recipient;
  }
  function decodeTokenToEthTransferOutputInputs(bytes memory args) internal pure returns (TokenToEthTransferOutputInputs memory) {
    (uint256 eth_bought, uint256 max_tokens, uint256 deadline, address payable recipient) = abi.decode(args, (uint256, uint256, uint256, address));
    return TokenToEthTransferOutputInputs({
      eth_bought: eth_bought,
      max_tokens: max_tokens,
      deadline: deadline,
      recipient: recipient
    });
  }
  struct TokenToTokenSwapOutputInputs {
    uint256 tokens_bought;
    uint256 max_tokens_sold;
    uint256 max_eth_sold;
    uint256 deadline;
    address payable token_addr;
  }
  function decodeTokenToTokenSwapOutputInputs(bytes memory args) internal pure returns (TokenToTokenSwapOutputInputs memory) {
    (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
    return TokenToTokenSwapOutputInputs({
      tokens_bought: tokens_bought,
      max_tokens_sold: max_tokens_sold,
      max_eth_sold: max_eth_sold,
      deadline: deadline,
      token_addr: token_addr
    });
  }
  struct TokenToTokenTransferOutputInputs {
    uint256 tokens_bought;
    uint256 max_tokens_sold;
    uint256 max_eth_sold;
    uint256 deadline;
    address payable recipient;
    address payable token_addr;
  }
  function decodeTokenToTokenTransferOutputInputs(bytes memory args) internal pure returns (TokenToTokenTransferOutputInputs memory) {
    (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable recipient, address payable token_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
    return TokenToTokenTransferOutputInputs({
      tokens_bought: tokens_bought,
      max_tokens_sold: max_tokens_sold,
      max_eth_sold: max_eth_sold,
      deadline: deadline,
      recipient: recipient,
      token_addr: token_addr
    });
  }
  struct TokenToExchangeSwapInputInputs {
    uint256 tokens_sold;
    uint256 min_tokens_bought;
    uint256 min_eth_bought;
    uint256 deadline;
    address payable exchange_addr;
  }
  function decodeTokenToExchangeSwapInputInputs(bytes memory args) internal pure returns (TokenToExchangeSwapInputInputs memory) {
    (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
    return TokenToExchangeSwapInputInputs({
      tokens_sold: tokens_sold,
      min_tokens_bought: min_tokens_bought,
      min_eth_bought: min_eth_bought,
      deadline: deadline,
      exchange_addr: exchange_addr
    });
  }
  struct TokenToExchangeTransferInputInputs {
    uint256 tokens_sold;
    uint256 min_tokens_bought;
    uint256 min_eth_bought;
    uint256 deadline;
    address payable recipient;
    address payable exchange_addr;
  }
  function decodeTokenToExchangeTransferInputInputs(bytes memory args) internal pure returns (TokenToExchangeTransferInputInputs memory) {
    (uint256 tokens_sold, uint256 min_tokens_bought, uint256 min_eth_bought, uint256 deadline, address payable recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
    return TokenToExchangeTransferInputInputs({
      tokens_sold: tokens_sold,
      min_tokens_bought: min_tokens_bought,
      min_eth_bought: min_eth_bought,
      deadline: deadline,
      recipient: recipient,
      exchange_addr: exchange_addr
    });
  }
  struct TokenToExchangeSwapOutputInputs {
    uint256 tokens_bought;
    uint256 max_tokens_sold;
    uint256 max_eth_sold;
    uint256 deadline;
    address payable exchange_addr;
  }
  function decodeTokenToExchangeSwapOutputInputs(bytes memory args) internal pure returns (TokenToExchangeSwapOutputInputs memory) {
    (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address));
    return TokenToExchangeSwapOutputInputs({
      tokens_bought: tokens_bought,
      max_tokens_sold: max_tokens_sold,
      max_eth_sold: max_eth_sold,
      deadline: deadline,
      exchange_addr: exchange_addr
    });
  }
  struct TokenToExchangeTransferOutputInputs {
    uint256 tokens_bought;
    uint256 max_tokens_sold;
    uint256 max_eth_sold;
    uint256 deadline;
    address payable recipient;
    address payable exchange_addr;
  }
  function decodeTokenToExchangeTransferOutputInputs(bytes memory args) internal pure returns (TokenToExchangeTransferOutputInputs memory) {
    (uint256 tokens_bought, uint256 max_tokens_sold, uint256 max_eth_sold, uint256 deadline, address payable recipient, address payable exchange_addr) = abi.decode(args, (uint256, uint256, uint256, uint256, address, address));
    return TokenToExchangeTransferOutputInputs({
      tokens_bought: tokens_bought,
      max_tokens_sold: max_tokens_sold,
      max_eth_sold: max_eth_sold,
      deadline: deadline,
      recipient: recipient,
      exchange_addr: exchange_addr
    });
  }
  struct AddLiquidityInputs {
    uint256 min_liquidity;
    uint256 max_tokens;
    uint256 deadline;
  }
  function decodeAddLiquidityInputs(bytes memory args) internal pure returns (AddLiquidityInputs memory) {
    (uint256 min_liquidity, uint256 max_tokens, uint256 deadline) = abi.decode(args, (uint256, uint256, uint256));
    return AddLiquidityInputs({
      min_liquidity: min_liquidity,
      max_tokens: max_tokens,
      deadline: deadline
    });
  }
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.uniswap-adapter", instance)));
  }
  function computeForwarderAddress() internal view returns (address payable) {
    return address(uint160(Create2.computeAddress(ETHER_FORWARDER_SALT, keccak256(type(AssetForwarder).creationCode))));
  }
  function callForwarder(address payable target, address payable token) internal {
    address forwarder = Create2.deploy(ETHER_FORWARDER_SALT, type(AssetForwarder).creationCode);
    AssetForwarder(forwarder).forwardAsset(target, token);
  }
  function getCastStorageType() internal pure returns (function (uint256) internal pure returns (ExternalIsolate storage) swap) {
    function (uint256) internal returns (uint256) cast = ModuleLib.cast;
    assembly {
      swap := cast
    }
  }
  function toIsolatePointer(uint256 key) internal pure returns (ExternalIsolate storage) {
    return getCastStorageType()(key);
  }
  function getIsolatePointer(address instance) internal pure returns (ExternalIsolate storage) {
    return toIsolatePointer(computeIsolatePointer(instance));
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
  function encodeLiquidationNotify(address newToken) internal pure returns (bytes memory result) {
    result = abi.encode(newToken);
  }
}
