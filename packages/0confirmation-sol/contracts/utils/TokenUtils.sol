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
    (bool success,) = token.call(abi.encodeWithSignature("approve(address,uint256)", target, amount));
    return success;
  }
  function getApproved(address token, address source, address target) internal returns (uint256) {
    uint256 amount = IERC20(token).approved(source, target);
    return amount;
  }
}
