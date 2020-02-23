pragma solidity ^0.6.2;

import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { SliceLib } from "./utils/SliceLib.sol";
import { IShifter } from "github.com/renproject/darknode-sol/contracts/Shifter/IShifter.sol";
import { IBorrowProxyController } from "./interfaces/IBorrowProxyController.sol";

contract BorrowProxy {
  using SliceLib for *;
  BorrowProxyLib.ProxyIsolate public isolate;
  modifier onlyOwner {
    require(msg.sender == isolate.owner, "borrow proxy can only be used by borrower");
    _;
  }
  constructor() public {
    isolate.masterAddress = msg.sender;
    isolate.owner = IBorrowProxyController(isolate.masterAddress).getProxyOwnerHandler();
  } 
  function validateProxyRecord(ShifterPoolLib.ProxyRecord memory record) internal returns (bool) {
    return ShifterPool(isolate.masterAddress).validateProxyRecordHandler(record);
  }
  function proxy(address to, uint256 value, bytes memory payload) public onlyOwner {
    if (isolate.unbound) {
      (bool success, bytes memory retval) = to.call(payload).value(value)();
      require(success, string(retval));
      assembly {
        return(add(retval, 0x20), mload(retval))
      }
    }
    bytes4 sig = bytes4(uint32(uint256(payload.toSlice(0, 4).asWord())));
    BorrowProxyLib.ModuleExecution memory module = isolate.getModuleFromMaster(to, sig);
    require(module.encapsulated.isDefined(), "function handler not registered");
    module.delegate(isolate, payload, value);
  }
}
