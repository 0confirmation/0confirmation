pragma solidity ^0.6.0;

contract ViewExecutor {
  function query(address viewLogic, bytes memory payload) public view returns (bytes memory) {
    (bool success, bytes memory response) = viewLogic.staticcall(abi.encodeWithSignature("_executeQuery(address,bytes)", viewLogic, payload));
    require(success, string(response));
    return response;
  }
  function _executeQuery(address delegateTo, bytes memory callData) public returns (bytes memory) {
    require(msg.sender == address(this), "unauthorized view layer delegation");
    (bool success, bytes memory retval) = delegateTo.delegatecall(callData);
    require(success);
    return retval;
  }
}
