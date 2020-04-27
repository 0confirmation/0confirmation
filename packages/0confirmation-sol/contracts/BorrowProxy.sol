pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { RevertCaptureLib } from "./utils/RevertCaptureLib.sol";
import { SliceLib } from "./utils/SliceLib.sol";
import { ViewExecutor } from "./utils/ViewExecutor.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { IBorrowProxyController } from "./interfaces/IBorrowProxyController.sol";
import { AddressSetLib } from "./utils/AddressSetLib.sol";
import { ModuleLib } from "./adapters/lib/ModuleLib.sol";

contract BorrowProxy {
  using SliceLib for *;
  using BorrowProxyLib for *;
  using AddressSetLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  modifier onlyOwnerOrPool {
   require(msg.sender == isolate.owner || msg.sender == isolate.masterAddress || msg.sender == address(this), "borrow proxy can only be used by borrower");
    _;
  }
  function setup(address owner, address token) public returns (bool) {
    require(isolate.owner == address(0x0), "can't initialize twice");
    isolate.masterAddress = msg.sender;
    isolate.owner = owner;
    isolate.token = token;
    return true;
  }
  function validateProxyRecord(bytes memory record) internal returns (bool) {
    return IBorrowProxyController(isolate.masterAddress).validateProxyRecordHandler(record);
  }
  event Log(string message);
  function proxy(address to, uint256 value, bytes memory payload) public onlyOwnerOrPool {
    bytes4 sig = bytes4(uint32(uint256(payload.toSlice(0, 4).asWord())));
    BorrowProxyLib.ModuleExecution memory module = isolate.fetchModule(to, sig);
    module.token = isolate.token;
    emit Log("entered proxy");
    if (isolate.unbound && !module.encapsulated.isPrecompiled) {
      (bool success, bytes memory retval) = to.call{
        value: value
      }(payload);
      if (!success) revert(RevertCaptureLib.decodeError(retval));
      ModuleLib.bubbleResult(success, retval);
      return;
    }
    require(module.encapsulated.isDefined(), "function handler not registered");
    (bool success, bytes memory retval) = module.delegate(payload, value);
    if (!success) revert(RevertCaptureLib.decodeError(retval));
    if (module.encapsulated.liquidationSubmodule != address(0x0)) isolate.liquidationSet.insert(module.encapsulated.liquidationSubmodule);
    if (module.encapsulated.repaymentSubmodule != address(0x0)) {
      isolate.repaymentSet.insert(module.encapsulated.repaymentSubmodule);
      emit Log("inserted into set");
    } else emit Log("did not insert into set");
    ModuleLib.bubbleResult(success, retval);
  }
  receive() external payable virtual {
    // just receive ether, do nothing
  } 
  fallback() external payable virtual {}
}
