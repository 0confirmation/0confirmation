pragma solidity ^0.6.0;

import { UniswapAdapter } from "./UniswapAdapter.sol";
import { IUniswapFactory } from "../../../interfaces/IUniswapFactory.sol";
import { IUniswapExchange } from "../../../interfaces/IUniswapExchange.sol";
import { SliceLib } from "../../../utils/SliceLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../../../ShifterBorrowProxyLib.sol";

library UniswapAdapterLib {
  using SliceLib for *;
  using BorrowProxyLib for *;
  using ShifterBorrowProxyLib for *;
  struct ExternalIsolate {
    address factoryAddress;
  }
  function cast(uint256 v) internal pure returns (uint256) {
    return v;
  }
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.uniswap-adapter", instance)));
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
}
