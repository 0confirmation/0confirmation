pragma solidity ^0.6.0;

import { UniswapAdapter } from "./UniswapAdapter.sol";
import { EtherForwarder } from "./EtherForwarder.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../../../ShifterBorrowProxyLib.sol";
import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";

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
  function addRecipient(TokenToTokenSwapInputInputs memory input, address recipient) internal pure returns (TokenToTokenTransferInputInputs memory) {
    return TokenToTokenTransferInputInputs({
      tokens_sold: input.tokens_sold,
      min_tokens_bought: input.min_tokens_bought,
      min_eth_bought: input.min_eth_bought,
      deadline: input.deadline,
      recipient: recipient,
      token_addr: input.token_addr
    });
  }
  function encodeTokenToTokenTransferInput(TokenToTokenTransferInputInputs memory input) internal pure returns (bytes memory) {
    return abi.encodeWithSelector(IUniswapExchange.tokenToTokenTransferInput.selector, input.tokens_sold, input.min_tokens_bought, input.min_eth_bought, input.deadline, input.recipient, input.token_addr);
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
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.uniswap-adapter", instance)));
  }
  function computeForwarderAddress() internal view returns (address) {
    return Create2.computeAddress(ETHER_FORWARDER_SALT, keccak256(type(EtherForwarder).creationCode));
  }
  function callForwarder(address payable target, address token) internal {
    address forwarder = Create2.deploy(ETHER_FORWARDER_SALT, type(EtherForwarder).creationCode);
    EtherForwarder(forwarder).forward(target, token);
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
}
