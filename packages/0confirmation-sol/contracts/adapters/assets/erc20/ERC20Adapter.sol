pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ModuleLib } from "../../lib/ModuleLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ERC20AdapterLib } from "./ERC20AdapterLib.sol";
import { TokenUtils } from "../../../utils/TokenUtils.sol";

contract ERC20Adapter {
  using ERC20AdapterLib for *;
  using ModuleLib for *;
  using TokenUtils for *;
  function repay(address /* moduleAddress */) public returns (bool) {
    ERC20AdapterLib.Isolate storage isolate = ERC20AdapterLib.getIsolatePointer();
    return isolate.processEscrowForwards();
  }
  receive() external payable {
    // no op
  }
  fallback() external {
    (/* address payable moduleAddress */, /* address liquidationSubmodule */, /* address repaymentSubmodule */, /* address txOrigin */, address to, /* uint256 value */, bytes memory payload) = abi.decode(msg.data, (address, address, address, address, address, uint256, bytes));
    ERC20AdapterLib.Isolate storage isolate = ERC20AdapterLib.getIsolatePointer();
    (bytes4 sig, bytes memory args) = payload.splitPayload();
    if (sig == IERC20.transfer.selector) {
       (address recipient, uint256 amount) = abi.decode(args, (address, uint256));
       address escrowWallet = ERC20AdapterLib.computeForwarderAddress(isolate.payments.length);
       isolate.payments.push(ERC20AdapterLib.EscrowRecord({
         recipient: recipient,
         token: to
       }));
       require(to.sendToken(escrowWallet, amount), "token transfer to escrow wallet failed");
    } else if (sig == IERC20.approve.selector) {
      // do nothing
    } else revert("unsupported token call");
  }
}
