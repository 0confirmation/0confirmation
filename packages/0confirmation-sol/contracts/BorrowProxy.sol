pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { RevertCaptureLib } from "./utils/RevertCaptureLib.sol";
import { SliceLib } from "./utils/SliceLib.sol";
import { ViewExecutor } from "./utils/ViewExecutor.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { IBorrowProxyController } from "./interfaces/IBorrowProxyController.sol";
import { AddressSetLib } from "./utils/AddressSetLib.sol";

contract BorrowProxy is ViewExecutor {
  using SliceLib for *;
  using BorrowProxyLib for *;
  using AddressSetLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  modifier onlyOwnerOrPool {
   require(msg.sender == isolate.owner || msg.sender == isolate.masterAddress, "borrow proxy can only be used by borrower");
    _;
  }
  function setup(address owner) public returns (bool) {
    require(isolate.owner == address(0x0), "can't initialize twice");
    isolate.masterAddress = msg.sender;
    isolate.owner = owner;
    return true;
  }
  function validateProxyRecord(bytes memory record) internal returns (bool) {
    return IBorrowProxyController(isolate.masterAddress).validateProxyRecordHandler(record);
  }
  function proxy(address to, uint256 value, bytes memory payload) public onlyOwnerOrPool {
    if (isolate.unbound) {
      (bool success, bytes memory retval) = to.call.value(value)(payload);
      if (!success) revert(RevertCaptureLib.decodeError(retval));
      assembly {
        return(add(retval, 0x20), mload(retval))
      }
    }
    bytes4 sig = bytes4(uint32(uint256(payload.toSlice(0, 4).asWord())));
    BorrowProxyLib.ModuleExecution memory module = isolate.fetchModule(to, sig);
    require(module.encapsulated.isDefined(), "function handler not registered");
    (bool success, bytes memory retval) = module.delegate(payload, value);
    if (!success) revert(RevertCaptureLib.decodeError(retval));
    if (module.encapsulated.liquidationSubmodule != address(0x0)) isolate.liquidationSet.insert(module.encapsulated.liquidationSubmodule);
    if (module.encapsulated.repaymentSubmodule != address(0x0)) isolate.repaymentSet.insert(module.encapsulated.repaymentSubmodule);
    assembly {
      return(add(retval, 0x20), mload(retval))
    }
  }
  receive() external payable virtual {
    // just receive ether, do nothing
  } 
  fallback() external payable virtual {}
}
