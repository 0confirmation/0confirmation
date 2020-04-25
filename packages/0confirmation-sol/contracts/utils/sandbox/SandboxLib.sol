pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { SliceLib } from "../SliceLib.sol";
import { SafeViewLib } from "./SafeViewLib.sol";
import { BorrowProxy } from "../../BorrowProxy.sol";
import { ShifterBorrowProxyLib } from "../../ShifterBorrowProxyLib.sol";

library SandboxLib {
  using SafeViewLib for *;
  using SliceLib for *;
  struct ProtectedExecution {
    address to;
    bytes txData;
    bool success;
    bytes returnData;
  }
  function applyExecutionResult(ProtectedExecution[][] memory trace, uint256 index, ShifterBorrowProxyLib.InitializationAction[] memory preprocessed) internal pure {
    ProtectedExecution[] memory execution = trace[index] = new ProtectedExecution[](preprocessed.length);
    for (uint256 i = 0; i < execution.length; i++) {
      execution[i].txData = preprocessed[i].txData;
      execution[i].to = preprocessed[i].to;
    }
  }
  struct Context {
    address preprocessorAddress;
    ProtectedExecution[][] trace;
  }
  function encodeContext(Context memory input) internal pure returns (bytes memory context) {
    context = abi.encode(input);
  }
  function toContext(bytes memory input) internal pure returns (Context memory context) {
    (context) = abi.decode(input, (Context));
  }
  function _write(ProtectedExecution[][] memory trace, uint256 newSize) internal pure {
    assembly {
      mstore(trace, newSize)
    }
  }
  function _restrict(Context memory context) internal pure {
    _write(context.trace, 0);
  }
  function _grow(Context memory context) internal pure {
    ProtectedExecution[][] memory trace = context.trace;
    uint256 newSize = trace.length;
    _write(trace, newSize + 1);
  }
  function toInitializationActions(bytes memory input) internal pure returns (ShifterBorrowProxyLib.InitializationAction[] memory action) {
    (action) = abi.decode(input, (ShifterBorrowProxyLib.InitializationAction[]));
  }
  function encodeInitializationActions(ShifterBorrowProxyLib.InitializationAction[] memory input) internal pure returns (bytes memory result) {
    result = abi.encode(input);
  }
  function _shrink(Context memory context) internal pure {
    _write(context.trace, context.trace.length - 1);
  }
  function encodeProxyCall(ProtectedExecution memory execution) internal pure returns (bytes memory retval) {
    retval = abi.encodeWithSelector(BorrowProxy.proxy.selector, execution.to, 0, execution.txData);
  }
  function processActions(ShifterBorrowProxyLib.InitializationAction[] memory actions) internal returns (Context memory) {
    ProtectedExecution[][] memory trace = new ProtectedExecution[][](actions.length);
    for (uint256 i = 0; i < actions.length; i++) {
      trace[i] = new ProtectedExecution[](1);
      trace[i][0].to = actions[i].to;
      trace[i][0].txData = actions[i].txData;
    }
    Context memory context = Context({
      trace: trace,
      preprocessorAddress: address(0)
    });
    _restrict(context);
    for (uint256 i = 0; i < actions.length; i++) {
      _grow(context);
      ProtectedExecution[] memory execution = context.trace[context.trace.length - 1];
      if (execution[0].to == address(0x0)) {
        _shrink(context);
        context.preprocessorAddress = execution[0].txData.deriveViewAddress();
        SafeViewLib.SafeViewResult memory safeViewResult = execution[0].txData.safeView(encodeContext(context));
        _grow(context);
        execution[0].txData = new bytes(0x0);
        if (safeViewResult.success) {
          ShifterBorrowProxyLib.InitializationAction[] memory newActions = toInitializationActions(safeViewResult.data);
          applyExecutionResult(trace, i, newActions);
          if (newActions.length == 0) break;
        } else {
          execution[0].returnData = safeViewResult.data;
          execution[0].success = safeViewResult.success;
          continue;
        }
      }
      for (uint256 j = 0; i < execution.length; i++) {
        (bool success, bytes memory returnData) = address(this).call(encodeProxyCall(execution[j]));
        execution[j].success = success;
        execution[j].returnData = returnData;
      }
    }
    return context;
  }
}
