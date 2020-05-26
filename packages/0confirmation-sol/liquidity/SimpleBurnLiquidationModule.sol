pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { AddressSetLib } from "../../utils/AddressSetLib.sol";
import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { TokenUtils } from "../../utils/TokenUtils.sol";
import { SimpleBurnLiquidationModuleLib } from "./SimpleBurnLiquidationModuleLib.sol";
import { ERC20AdapterLib } from "../assets/erc20/ERC20AdapterLib.sol";
import { UniswapV2AdapterLib } from "../assets/uniswap-v2/UniswapV2AdapterLib.sol";
import { IUniswapV2Router01 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import { ShifterPool } from "../../ShifterPool.sol";

contract SimpleBurnLiquidationModule {
  using AddressSetLib for *;
  using TokenUtils for *;
  using UniswapV2AdapterLib for *;
  BorrowProxyLib.ProxyIsolate proxyIsolate;
  constructor(address routerAddress, address erc20Module) public {
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer();
    isolate.routerAddress = routerAddress;
    isolate.erc20Module = erc20Module;
  }
  function notify(address /* moduleAddress */, bytes memory payload) public returns (bool) {
    (address token) = abi.decode(payload, (address));
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer();
    isolate.toLiquidate.insert(token);
    return true;
  }
  function liquidate(address moduleAddress) public returns (bool) {
    if (!ERC20AdapterLib.liquidate(proxyIsolate)) return false;
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer();
    address liquidateTo = address(uint160(proxyIsolate.token));
    IUniswapV2Router01 router = IUniswapV2Router01(isolate.routerAddress);
    address liquidityToken = ShifterPool(proxyIsolate.masterAddress).getLiquidityTokenForTokenHandler(liquidateTo);
    address WETH = router.WETH();
    uint256 i;
    uint256 received = 0;
    for (i = isolate.liquidated; i < isolate.toLiquidate.set.length; i++) {
      address tokenAddress = isolate.toLiquidate.set[i];
      if (liquidateTo == tokenAddress) continue;
      if (gasleft() < 3e5) {
        isolate.liquidated = i;
        return false;
      }
      uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));
      address[] memory path = UniswapV2AdapterLib.generatePathForToken(tokenAddress, WETH, liquidateTo);
      tokenAddress.approveForMaxIfNeeded(address(router));
      router.swapExactTokensForTokens(tokenBalance, 1, path, liquidityToken, block.timestamp + 1);
    }
    isolate.liquidated = i;
    return true;
  }
  function getExternalIsolateHandler() external view returns (SimpleBurnLiquidationModuleLib.ExternalIsolate memory) {
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer();
    return SimpleBurnLiquidationModuleLib.ExternalIsolate({
      routerAddress: isolate.routerAddress,
      erc20Module: isolate.erc20Module
    });
  }
}
