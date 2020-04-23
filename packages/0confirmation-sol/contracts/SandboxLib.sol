pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { SafeViewLib } from "./utils/SafeView.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";

library SandboxLib {
  using SafeViewLib for *;
  struct ProtectedExecution {
    address to;
    bytes txData;
    bool success;
    bytes returnData;
  }
  function applyExecutionResult(ProtectedExecution memory execution, ShifterBorrowProxyLib.InitializationAction memory preprocessed) internal pure {
    execution.txData = preprocessed.txData;
    execution.to = preprocessed.to;
  }
  struct Context {
    address preprocessorAddress;
    ProtectedExecution[] trace;
  }
  function toContext(bytes memory input) internal pure returns (Context memory context) {
    (context) = abi.decode(input, (Context));
  }
  function encodeContext(Context memory context) internal pure returns (bytes memory data) {
    data = abi.encode(context);
  }
  function _write(ProtectedExecution[] memory trace, uint256 newSize) internal pure {
    assembly {
      mstore(trace, newSize)
    }
  }
  function _restrict(Context memory context) internal pure {
    _write(context.trace, 0);
  }
  function _grow(Context memory context) internal pure {
    ProtectedExecution[] memory trace = context.trace;
    uint256 newSize = trace.length;
    _write(trace, newSize + 1);
  }
  function toInitializationAction(bytes memory input) internal pure returns (ShifterBorrowProxyLib.InitializationAction memory action) {
    (action) = abi.decode(input, (ShifterBorrowProxyLib.InitializationAction));
  }
  function validateEncoding(bytes memory returnData) internal pure returns (bool success) {
    assembly {
      let length := mload(returnData)
      if gt(length, 0x5f) {
        let ptr := mload(add(returnData, 0x40))
	if lt(ptr, sub(length, 0x20)) {
	  let dataLength := mload(add(add(returnData, 0x20), ptr))
	  if iszero(gt(add(ptr, dataLength), length)) {
	    success := true
	  }
	}
      }
    }
  }
  function _shrink(Context memory context) internal pure {
    _write(context.trace, context.trace.length - 1);
  }
  function encodeProxyCall(ProtectedExecution memory execution) internal pure returns (bytes memory retval) {
    retval = abi.encodeWithSelector(BorrowProxy.proxy.selector, execution.to, 0, execution.txData);
  }
  function processActions(ShifterBorrowProxyLib.InitializationAction[] memory actions) internal returns (Context memory) {
    ProtectedExecution[] memory trace = new ProtectedExecution[](actions.length);
    for (uint256 i = 0; i < actions.length; i++) {
      trace[i].to = actions[i].to;
      trace[i].txData = actions[i].txData;
    }
    Context memory context = Context({
      trace: trace,
      preprocessorAddress: address(0)
    });
    _restrict(context);
    for (uint256 i = 0; i < actions.length; i++) {
      _grow(context);
      ProtectedExecution memory execution = context.trace[context.trace.length - 1];
      if (execution.to == address(0x0)) {
        _shrink(context);
        context.preprocessorAddress = execution.txData.deriveViewAddress();
        SafeViewLib.SafeViewResult memory safeViewResult = execution.txData.safeView(encodeContext(context));
        _grow(context);
        execution.txData = new bytes(0x0);
        if (safeViewResult.success) {
          ShifterBorrowProxyLib.InitializationAction memory newAction = toInitializationAction(safeViewResult.data);
          applyExecutionResult(execution, newAction);
        } else {
          execution.returnData = safeViewResult.data;
          execution.success = safeViewResult.success;
          continue;
        }
      }
      (bool success, bytes memory returnData) = address(this).call(encodeProxyCall(execution));
      execution.success = success;
      execution.returnData = returnData;
    }
    return context;
  }
}
