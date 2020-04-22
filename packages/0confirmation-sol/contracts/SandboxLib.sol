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
  function computeAction(Context memory context) internal {
    ProtectedExecution memory execution = getCurrentExecution(context);
    SafeViewResult result = execution.input.txData.safeView(encodeContext(context));
    if (!result.success || result.success && !validateEncoding(result.returnData)) {
      execution.result.success = false;
      return;
    }
    if (!execution.result.success) {
      p
    execution.
    execution.result.success = result.success;
    execution.result.returnData = result.data;
    context.pc += 1;
  }

