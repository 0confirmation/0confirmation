pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { TokenUtils } from "../../utils/TokenUtils.sol";
import { ModuleLib } from "../lib/ModuleLib.sol";
import { SimpleBurnLiquidationModuleLib } from "../liquidity/SimpleBurnLiquidationModuleLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

library AbsorbLib {
  using TokenUtils for *;
  using ModuleLib for *;
  struct AbsorbInputs {
    address payable target;
  }
  function decodeAbsorbInputs(bytes memory args) internal pure returns (AbsorbInputs memory) {
    (address payable target) = abi.decode(args, (address));
    return AbsorbInputs({
      target: target
    });
  }
  function maybeForwardThroughERC20Adapter(address token, address recipient) internal returns (bool) {
    uint256 balanceOf = IERC20(token).balanceOf(address(this));
    if (isolate.unbound) return token.sendToken(recipient, balanceOf);
    (bool success, ) = address(this).delegatecall(abi.encodeWithSelector(BorrowProxy.proxy.selector, token, 0, abi.encodeWithSelector(IERC20.transfer.selector, recipient, balanceOf)));
    return success;
  }
  function getExtCodeSize(address payable target) internal view returns (uint256 sz) {
    assembly {
      sz := extcodesize(target)
    }
  }
  function absorbImpl(address payable target) internal returns (bool) {
    SimpleBurnLiquidationModuleLib.Isolate storage burnIsolate = SimpleBurnLiquidationModuleLib.getIsolatePointer();
    address[] memory set = burnIsolate.toLiquidate.set;
    address token = isolate.token;
    require(maybeForwardThroughERC20Adapter(token, target), "failed to forward token");
    for (uint256 i = 0; i < set.length; i++) {
      require(maybeForwardThroughERC20Adapter(set[i], target), "failed to forward token");
    }
    uint256 sz = getExtCodeSize(target);
    if (sz == 0) target.transfer(address(this).balance);
    return true;
  }
}
