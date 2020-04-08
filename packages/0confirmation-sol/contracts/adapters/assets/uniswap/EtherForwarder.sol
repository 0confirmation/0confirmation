pragma solidity ^0.6.0;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";

contract EtherForwarder {
  using TokenUtils for *;
  event EtherForwardFailure();
  function forward(address payable target, address token) public {
    (bool success, ) = target.call{ value: address(this).balance, gas: gasleft() }("");
    require(success, "ether transfer failure");
    if (token != address(0x0)) {
      require(IERC20(token).transfer(target, IERC20(token).balanceOf(address(this))), "erc20 transfer failure");
    } 
    selfdestruct(target);
  }
}
