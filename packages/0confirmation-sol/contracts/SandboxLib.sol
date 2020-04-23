pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { SafeViewLib } from "./utils/SafeView.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";

library SandboxLib {
  using SafeViewLib for *;
  struct Result {
    bool success;
    bytes returnData;
  }
  struct ProtectedExecution {
    ShifterBorrowProxyLib.InitializationAction input;
    Result output;
  }
  struct Context {
    ProtectedExecution[] trace;
    uint256 pc;
  }
  function toContext(ShifterBorrowProxyLib.InitializationAction[] memory actions) internal pure returns (Context memory) {
    ProtectedExecution[] memory trace = new ProtectedExecution[](actions.length);
    for (uint256 i = 0; i < actions.length; i++) {
      trace[i].input = actions[i];
    }
    return Context({
      pc: 0,
      trace: trace
    });
  }
  function getCurrentExecution(Context memory context) internal pure returns (ProtectedExecution memory) {
    return context.trace[context.pc];
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
  function toContext(bytes memory input) internal pure returns (Context memory context) {
    (context) = abi.decode(input, (Context));
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
  function computeAction(Context memory context) internal returns (bool) {
    ProtectedExecution memory execution = getCurrentExecution(context);
    _shrink(context);
    SafeViewLib.SafeViewResult memory result = execution.input.txData.safeView(encodeContext(context));
    _grow(context);
    execution.input.txData = new bytes(0);
    if (!result.success || result.success) { //&& !validateEncoding(result.data)) {
      return false;
    }
    ShifterBorrowProxyLib.InitializationAction memory decoded = toInitializationAction(result.data);
    execution.input.txData = decoded.txData;
    execution.input.to = decoded.to;
    return true;
  }
  function encodeProxyCall(ShifterBorrowProxyLib.InitializationAction memory action) internal pure returns (bytes memory retval) {
    retval = abi.encodeWithSelector(BorrowProxy.proxy.selector, action.to, 0, action.txData);
  }
  function processActions(ShifterBorrowProxyLib.InitializationAction[] memory actions) internal returns (Context memory) {
    Context memory context = toContext(actions);
    _restrict(context);
    for (; context.pc < actions.length; context.pc++) {
      _grow(context);
      ProtectedExecution memory execution = getCurrentExecution(context);
      ShifterBorrowProxyLib.InitializationAction memory action = execution.input;
      if (action.to == address(0x0) && !computeAction(context)) continue;
      (bool success, bytes memory returnData) = address(this).call(encodeProxyCall(action));
      execution.output.success = success;
      execution.output.returnData = returnData;
    }
    return context;
  }
}
