pragma solidity ^0.6.2;

import { IERC20 } from "github.com/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

library TokenUtils {
  function sendToken(address token, address target, uint256 amount) internal returns (bool) {
    (bool success,) = token.call(abi.encodeWithSelector("transfer(address,uint256)", target, amount));
    return success;
  }
}
    
    
