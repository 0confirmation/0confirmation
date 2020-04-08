pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ERC20AdapterLib } from "./ERC20AdapterLib.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";

contract ERC20Forwarder {
  using TokenUtils for *;
  function forwardToken(ERC20AdapterLib.EscrowRecord memory record) public {
    require(record.token.sendToken(record.recipient, IERC20(record.token).balanceOf(address(this))), "forwarding token failed");
    selfdestruct(msg.sender);
  }
  function returnToken(ERC20AdapterLib.EscrowRecord memory record) public {
    require(record.token.sendToken(msg.sender, IERC20(record.token).balanceOf(address(this))), "returning token failed");
    selfdestruct(msg.sender);
  }
}
