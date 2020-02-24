pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { AddressSetLib } from "../../utils/AddressSetLib.sol";
import { IUniswapExchange } from "../../interfaces/IUniswapExchange.sol";
import { IUniswapFactory } from "../../interfaces/IUniswapFactory.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract SimpleBurnLiquidationModule {
  using AddressSetLib for *;
  struct Isolate {
    address factoryAddress;
    uint256 liquidated;
    AddressSetLib.AddressSet toLiquidate;
  }
  struct ExternalIsolate {
    address factoryAddress;
  }
  constructor(address factoryAddress) public {
    Isolate storage isolate = getIsolatePointer(address(this));
    isolate.factoryAddress = factoryAddress;
  }
  function notify(address moduleAddress, bytes memory payload) public returns (bool) {
    (address token) = abi.decode(payload, (address));
    Isolate storage isolate = getIsolatePointer(moduleAddress);
    isolate.toLiquidate.insert(token);
    return true;
  }
  function liquidate(address moduleAddress) public returns (bool) {
    Isolate storage isolate = getIsolatePointer(moduleAddress);
    IUniswapFactory factory = IUniswapFactory(isolate.factoryAddress);
    uint256 i;
    for (i = isolate.liquidated; i < isolate.toLiquidate.set.length; i++) {
      if (gasleft() < 3e5) {
        isolate.liquidated = i;
        return false;
      }
      address tokenAddress = isolate.toLiquidate.set[i];
      uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
      address payable exchangeAddress = factory.getExchange(tokenAddress);
      IERC20(tokenAddress).approve(exchangeAddress, 0); // needed for many tokens
      IERC20(tokenAddress).approve(exchangeAddress, tokenBalance);
      IUniswapExchange(exchangeAddress).tokenToEthSwapInput(tokenBalance, 0, block.number + 1);
    }
    isolate.liquidated = i;
    return true;
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
  function getExternalIsolateHandler() external returns (ExternalIsolate memory) {
    return ExternalIsolate({
      factoryAddress: getIsolatePointer(address(this)).factoryAddress
    });
  }
  function getExternalIsolate(address moduleAddress) internal returns (ExternalIsolate memory) {
    return SimpleBurnLiquidationModule(moduleAddress).getExternalIsolateHandler();
  }
}
