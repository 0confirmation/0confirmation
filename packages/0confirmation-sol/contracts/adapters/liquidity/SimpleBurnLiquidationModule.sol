pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { AddressSetLib } from "../../utils/AddressSetLib.sol";
import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { IUniswapExchange } from "../../interfaces/IUniswapExchange.sol";
import { IUniswapFactory } from "../../interfaces/IUniswapFactory.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { TokenUtils } from "../../utils/TokenUtils.sol";
import { SimpleBurnLiquidationModuleLib } from "./SimpleBurnLiquidationModuleLib.sol";

contract SimpleBurnLiquidationModule {
  using AddressSetLib for *;
  using TokenUtils for *;
  BorrowProxyLib.ProxyIsolate proxyIsolate;
  constructor(address factoryAddress, address liquidateTo) public {
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer(address(this));
    isolate.factoryAddress = factoryAddress;
    isolate.liquidateTo = liquidateTo;
  }
  function notify(address moduleAddress, bytes memory payload) public returns (bool) {
    (address token) = abi.decode(payload, (address));
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer(moduleAddress);
    isolate.toLiquidate.insert(token);
    return true;
  }
  function liquidate(address moduleAddress) public returns (bool) {
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer(moduleAddress);
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
    SimpleBurnLiquidationModuleLib.ExternalIsolate memory externalIsolate = SimpleBurnLiquidationModule(moduleAddress).getExternalIsolateHandler();
    uint256 received = IUniswapExchange(factory.getExchange(externalIsolate.liquidateTo)).ethToTokenSwapInput.value(address(this).balance)(0, block.number + 1);
    isolate.liquidated = i;
    bool success = externalIsolate.liquidateTo.sendToken(proxyIsolate.masterAddress, received);
    require(success, "liquidated token transfer failed");
    return true;
  }
  function getExternalIsolateHandler() external returns (SimpleBurnLiquidationModuleLib.ExternalIsolate memory) {
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer(address(this));
    return SimpleBurnLiquidationModuleLib.ExternalIsolate({
      factoryAddress: isolate.factoryAddress,
      liquidateTo: isolate.liquidateTo
    });
  }
}
