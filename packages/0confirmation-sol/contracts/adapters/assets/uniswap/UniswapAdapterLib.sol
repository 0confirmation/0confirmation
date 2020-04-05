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
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.uniswap-adapter", instance)));
  }
  function computeForwarderAddress() internal view returns (address) {
    return Create2.computeAddress(ETHER_FORWARDER_SALT, keccak256(type(EtherForwarder).creationCode));
  }
  function callForwarder(address payable target) internal {
    address forwarder = Create2.deploy(ETHER_FORWARDER_SALT, type(EtherForwarder).creationCode);
    EtherForwarder(forwarder).forward(target);
  }
  function toIsolatePointer(uint256 key) internal returns (ExternalIsolate storage) {
    function (uint256) internal returns (ExternalIsolate storage) swap;
    function (uint256) internal returns (uint256) real = ModuleLib.cast;
    assembly {
      swap := real
    }
    return swap(key);
  }
  function getIsolatePointer(address instance) internal returns (ExternalIsolate storage) {
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
