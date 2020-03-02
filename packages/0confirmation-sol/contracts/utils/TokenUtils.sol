pragma solidity ^0.6.2;

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
}
