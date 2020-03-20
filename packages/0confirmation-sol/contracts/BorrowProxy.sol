pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { SliceLib } from "./utils/SliceLib.sol";
import { ViewExecutor } from "./utils/ViewExecutor.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { IBorrowProxyController } from "./interfaces/IBorrowProxyController.sol";

contract BorrowProxy is ViewExecutor {
  using SliceLib for *;
  using BorrowProxyLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  modifier onlyOwner {
   require(msg.sender == isolate.owner, "borrow proxy can only be used by borrower");
    _;
  }
  constructor() public {
    isolate.masterAddress = msg.sender;
    isolate.owner = IBorrowProxyController(isolate.masterAddress).getProxyOwnerHandler();
  } 
  function validateProxyRecord(bytes memory record) internal returns (bool) {
    return IBorrowProxyController(isolate.masterAddress).validateProxyRecordHandler(record);
  }
  function proxy(address to, uint256 value, bytes memory payload) public onlyOwner {
    if (isolate.unbound) {
      (bool success, bytes memory retval) = to.call.value(value)(payload);
      require(success, string(retval));
      assembly {
        return(add(retval, 0x20), mload(retval))
      }
    }
    bytes4 sig = bytes4(uint32(uint256(payload.toSlice(0, 4).asWord())));
    BorrowProxyLib.ModuleExecution memory module = isolate.fetchModule(to, sig);
    require(module.encapsulated.isDefined(), "function handler not registered");
    module.delegate(payload, value);
  }
}
