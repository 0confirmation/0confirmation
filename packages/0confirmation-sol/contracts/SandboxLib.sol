pragma solidity ^0.6.0;

import { SafeViewLib } from "./utils/SafeView.sol";

library SandboxLib {
  struct Result {
    bool success;
    bytes returnData;
  }
  struct ProtectedExecution {
    ShifterPoolLib.InitializationAction input;
    Result output;
  }
  struct Context {
    ProtectedExecution[] trace;
    uint256 pc;
  }
  function toContext(InitializationAction[] memory actions) internal pure returns (Context memory) {
    ProtectedExecution[] memory trace = new ProtectedExecution[](actions.length);
    for (uint256 i = 0; i < actions.length; i++) {
      trace[i].input = actions[i];
    }
    return Context({
      pc: 0,
      trace: trace
    });
  }
  function getCurrentExecution(Context memory context) internal returns (ProtectedExecution memory) {
    return context.trace[context.pc];
  }
  function encodeContext(Context memory context) internal pure returns (bytes memory data) {
    data = abi.encode(context);
  }
  function _write(ProtectedExecution memory trace, uint256 newSize) internal pure {
    assembly {
      mstore(trace, newSize)
    }
  }
  function restrict(Context memory context) internal pure {
    _write(context.trace, 0);
  }
  function grow(Context memory context) internal pure {
    ProtectedExecution memory trace = context.trace;
    uint256 newSize = trace.length;
    _write(trace, newSize);
  }
  function toContext(bytes memory input) internal pure returns (Context memory context) {
    (context) = abi.decode(input, (Context));
    restrict(context);
  }
  function toInitializationAction(bytes memory input) internal pure returns (ShifterPoolLib.InitializationAction memory action) {
    (action) = abi.decode(input, (ShifterPoolInitializationAction));
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
  function _shrink(ProtectedExecution[] memory trace) internal pure {
    _write(trace, trace.length - 1);
  }
  function computeAction(Context memory context) internal returns (bool) {
    ProtectedExecution memory execution = getCurrentExecution(context);
    _shrink(context.trace);
    SafeViewResult result = execution.input.txData.safeView(encodeContext(context));
    _grow(context.trace);
    execution.input.txData = new bytes(0);
    if (!result.success || result.success && !validateEncoding(result.returnData)) {
      return false;
    }
    InitializationAction memory decoded = toInitializationAction(result.returnData);
    execution.input.txData = decoded.txData;
    execution.input.to = decoded.to;
    return true;
  }
  function encodeProxyCall(InitializationAction memory action) internal pure returns (bytes memory) {
    return abi.encodeWithSelector(BorrowProxy.proxy.selector, action.to, 0, action.txData);
  }
  event ExecutionPerformed(Context memory context);
  function processActions(address payable proxyAddress, InitializationAction[] memory actions) internal returns (Context memory) {
    Context memory context = toInitializationActions(actions);
    for (context.pc < actions.length; context.pc++) {
      _grow(context);
      InitializationAction memory action = context.trace[i];
      if (action.to == address(0x0) && !computeAction(context)) continue;
      (bool success, bytes memory returnData) = proxyAddress.call(encodeProxyCall(action));
      context.result.success = success;
      context.result.returnData = returnData;
    }
    emit ExecutionPerformed(context);
    return context;
  }
}
