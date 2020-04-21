pragma solidity ^0.6.0;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";

interface ISafeView {
  function execute(bytes calldata) external;
  function destroy() public;
  function _executeSafeView(bytes calldata, address payable, bytes calldata) external;
}

library SafeViewLib {
  struct SafeViewResult {
    bool success;
    bytes data;
  }
  function executeLogic(address viewLayer, address payable sender, bytes memory context) internal returns (SafeViewResult memory) {
    (bool success, bytes memory retval) = viewLayer.delegatecall(abi.encodeWithSelector(ISafeView.execute.selector, sender, context));
    return SafeViewResult({
      success: success,
      data: retval
    });
  }
  function encodeResult(SafeViewResult memory input) internal pure returns (bytes memory) {
    return abi.encode(input);
  }
  function revertWithData(bytes memory input) internal {
    assembly {
      retval(add(input, 0x20), mload(input))
    }
  }
  function decodeViewResult(bytes memory data) internal pure returns (SafeViewResult memory result) {
     (result) = abi.decode(data, (SafeViewResult));
     return result;
   }
}

contract SafeViewExecutor {
  using SafeViewLib for *;
  bytes32 constant STEALTH_VIEW_DEPLOY_SALT = 0xad53495153c7c363e98a26920ec679e0e687636458f6908c91cf6deadb190801;
  function safeView(bytes memory creationCode, bytes memory context) internal returns (SafeViewResult memory) {
    (/* bool success */, bytes memory retval) = address(this).call(abi.encodeWithSelector(ISafeView._executeSafeView.selector, msg.sender, context);
    return retval.decodeViewResult();
  }
  function _executeSafeView(bytes memory creationCode, bytes memory context) public {
    require(address(this) == msg.sender, "safe view can only be triggered by self");
    address viewLayer = Create2.deploy(STEALTH_VIEW_DEPLOY_SALT, creationCode);
    bytes memory result = viewLayer.executeLogic().encodeResult();
    (bool success) = viewLayer.call(abi.encodeWithSelector(ISafeView.destroy.selector));
    if (success) {} // ignore compiler warning?
    result.revertWithData();
  }
}
