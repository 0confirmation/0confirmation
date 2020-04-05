pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ERC20AdapterLib } from "./ERC20AdapterLib.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";

contract ERC20Forwarder {
  using TokenUtils for *;
  function forwardToken(ERC20AdapterLib.EscrowRecord memory record) public returns (bool) {
    bool success = record.token.sendToken(record.recipient, IERC20(record.token).balanceOf(address(this)));
    selfdestruct(msg.sender);
    return success;
  
  }
  function returnToken(ERC20AdapterLib.EscrowRecord memory record) public returns (bool) {
    bool success = record.token.sendToken(msg.sender, IERC20(record.token).balanceOf(address(this)));
    selfdestruct(msg.sender);
    return success;
  }
}
