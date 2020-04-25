pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { ShifterBorrowProxy } from "./ShifterBorrowProxy.sol";

library ShifterBorrowProxyFactoryLib {
  function deployBorrowProxy(bytes32 salt) external returns (address output) {
    return Create2.deploy(0, salt, type(ShifterBorrowProxy).creationCode);
  }
  function deriveBorrowerAddress(bytes32 salt) external view returns (address) {
    return Create2.computeAddress(salt, keccak256(type(ShifterBorrowProxy).creationCode));
  }
}
