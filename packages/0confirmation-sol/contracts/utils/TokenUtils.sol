pragma solidity ^0.6.0;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

library TokenUtils {
  function sendToken(address token, address target, uint256 amount) internal returns (bool) {
    (bool success,) = token.call(abi.encodeWithSignature("transfer(address,uint256)", target, amount));
    return success;
  }
  function transferTokenFrom(address token, address from, address to, uint256 amount) internal returns (bool) {
    (bool success,) = token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount));
    return success;
  }
  function approveToken(address token, address target, uint256 amount) internal returns (bool) {
/*
    (bool success,) = token.call(abi.encodeWithSignature("approve(address,uint256)", target, amount));
*/
    bool success = IERC20(token).approve(target, amount);
    return success;
  }
  uint256 constant THRESHOLD = 0x3fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
  uint256 constant MAX_UINT256 = 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
  function approveForMaxIfNeeded(address token, address target) internal returns (bool) {
    uint256 approved = getApproved(token, address(this), target);
    if (approved > THRESHOLD) return true;
    if (approved != 0 && !approveToken(token, address(this), 0)) return false;
    return approveToken(token, target, MAX_UINT256);
  }
  function getApproved(address token, address source, address target) internal returns (uint256) {
    (bool success, bytes memory retval) = token.call(abi.encodeWithSignature("allowance(address,address)", source, target));
    if (!success || retval.length != 0x20) return 0x1;
    (uint256 result) = abi.decode(retval, (uint256));
    return result;
  }
}
