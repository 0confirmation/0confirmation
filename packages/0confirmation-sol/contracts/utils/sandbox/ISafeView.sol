pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface ISafeView {
  function execute(bytes calldata) external;
  function _executeSafeView(bytes calldata, bytes calldata) external;
}
