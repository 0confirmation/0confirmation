pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { AddressSetLib } from "../../utils/AddressSetLib.sol";
import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { IUniswapExchange } from "../../interfaces/IUniswapExchange.sol";
import { IUniswapFactory } from "../../interfaces/IUniswapFactory.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { TokenUtils } from "../../utils/TokenUtils.sol";
import { SimpleBurnLiquidationModule } from "./SimpleBurnLiquidationModule.sol";

library SimpleBurnLiquidationModuleLib {
  struct Isolate {
    address factoryAddress;
    address liquidateTo;
    uint256 liquidated;
    AddressSetLib.AddressSet toLiquidate;
  }
  struct ExternalIsolate {
    address factoryAddress;
    address liquidateTo;
  }
  function computeIsolatePointer(address instance) public pure returns (uint256) {
    return uint256(keccak256(abi.encodePacked("isolate.simple-burn", instance)));
  }
  function cast(uint256 v) internal pure returns (uint256) {
    return v;
  }
  function toIsolatePointer(uint256 key) internal returns (Isolate storage) {
    function (uint256) internal returns (Isolate storage) swap;
    function (uint256) internal returns (uint256) real = cast;
    assembly {
      swap := real
    }
    return swap(key);
  }
  function getIsolatePointer(address moduleAddress) internal returns (Isolate storage) {
    return toIsolatePointer(computeIsolatePointer(moduleAddress));
  }
  function getExternalIsolate(address moduleAddress) internal returns (ExternalIsolate memory) {
    return SimpleBurnLiquidationModule(moduleAddress).getExternalIsolateHandler();
  }
}
