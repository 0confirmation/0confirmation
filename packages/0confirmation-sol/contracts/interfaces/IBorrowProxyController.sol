pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface IBorrowProxyController {
  function getProxyOwnerHandler() external returns (address);
  function validateProxyRecordHandler(bytes calldata) external returns (bool);
}
