pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ModuleLib } from "../../lib/ModuleLib.sol";
import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
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
  function handle(ModuleLib.AssetSubmodulePayload memory payload) public payable {
    if (true) revert("woop");
    ERC20AdapterLib.Isolate storage isolate = ERC20AdapterLib.getIsolatePointer();
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    if (sig == ERC20.transfer.selector) {
       ERC20AdapterLib.TransferInputs memory inputs = args.decodeTransferInputs();
       address escrowWallet = ERC20AdapterLib.computeForwarderAddress(isolate.payments.length);
       isolate.payments.push(ERC20AdapterLib.EscrowRecord({
         recipient: inputs.recipient,
         token: payload.to
       }));
       require(payload.to.sendToken(escrowWallet, inputs.amount), "token transfer to escrow wallet failed");
    } else if (sig == ERC20.approve.selector) {
      // do nothing
    } else revert("unsupported token call");
  }
}
