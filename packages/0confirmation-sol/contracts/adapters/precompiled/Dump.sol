pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { TokenUtils } from "../../utils/TokenUtils.sol";
import { ModuleLib } from "../lib/ModuleLib.sol";
import { SimpleBurnLiquidationModuleLib } from "../liquidity/SimpleBurnLiquidationModuleLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Dump {
  using ModuleLib for *;
  using TokenUtils for *;
  BorrowProxyLib.ProxyIsolate isolate;
  receive() external payable {
    // no-op
  }
  fallback() external payable {
    ModuleLib.AssetSubmodulePayload memory payload = msg.data.decodeAssetSubmodulePayload();
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    if (sig == bytes4(keccak256("dump(address,address)");
    SimpleBurnLiquidationModuleLib.Isolate storage burnIsolate = SimpleBurnLiquidationModuleLib.getIsolatePointer();
    address[] memory set = burnIsolate.toLiquidate.set;
    SimpleBurnLiquidationModuleLib.ExternalIsolate memory externalIsolate = SimpleBurnLiquidationModuleLib.getExternalIsolate(liquidationSubmodule);
    address liquidateTo = externalIsolate.liquidateTo;
    require(liquidateTo.sendToken(txOrigin, IERC20(liquidateTo).balanceOf(address(this))), "failed to forward token");
    for (uint256 i = 0; i < set.length; i++) {
      require(set[i].sendToken(txOrigin, IERC20(set[i]).balanceOf(address(this))), "failed to forward token");
    }
    txOrigin.transfer(address(this).balance);
  }
}
