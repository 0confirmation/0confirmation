pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { IUniswapV2Pair } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import { IUniswapV2Factory } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import { UniswapV2Adapter } from "./UniswapV2Adapter.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../../../ShifterBorrowProxyLib.sol";
import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { ModuleLib } from "../../lib/ModuleLib.sol";

library UniswapV2AdapterLib {
  using BorrowProxyLib for *;
  using ShifterBorrowProxyLib for *;
  bytes32 constant ETHER_FORWARDER_SALT = 0x3e8d8e49b9a35f50b96f6ba4b93e0fc6c1d66a2e1c04975ef848d7031c8158a4; // keccak("uniswap-adapter.ether-forwarder")
  struct ExternalIsolate {
    address factoryAddress;
    address assetForwarderImplementation;
    uint256 liquidityMinimum;
  }
  struct SwapInputs {
    uint256 amount0Out;
    uint256 amount1Out;
    address to;
    bytes data;
  }
  function decodeSwapInputs(bytes memory args) internal pure returns (SwapInputs memory) {
    (uint256 amount0Out, uint256 amount1Out, address to, bytes memory data) = abi.decode(args, (uint256, uint256, address, bytes));
    return SwapInputs({
      amount0Out: amount0Out,
      amount1Out: amount1Out,
      to: to,
      data: data
    });
  }
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.uniswap-v2-adapter", instance)));
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
    return UniswapV2Adapter(moduleAddress).getExternalIsolateHandler();
  }
  function getFactory(address payable moduleAddress) internal returns (IUniswapV2Factory) {
    return IUniswapV2Factory(getExternalIsolate(moduleAddress).factoryAddress);
  }
  function validateExchange(address payable moduleAddress, address to) internal returns (IUniswapV2Factory factory, address token0, address token1) {
    IUniswapV2Pair pair = IUniswapV2Pair(to);
    factory = getFactory(moduleAddress);
    require(pair.factory() == address(factory), "not a valid uniswap market");
    
    token0 = pair.token0();
    token1 = pair.token1();
  }
  function encodeLiquidationNotify(address newToken) internal pure returns (bytes memory result) {
    result = abi.encode(newToken);
  }
}
