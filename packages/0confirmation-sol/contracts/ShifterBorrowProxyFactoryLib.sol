pragma solidity ^0.6.3;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { ShifterBorrowProxy } from "./ShifterBorrowProxy.sol";

library ShifterBorrowProxyFactoryLib {
  function deployBorrowProxy(bytes32 salt) internal returns (address output) {
    return Create2.deploy(salt, type(ShifterBorrowProxy).creationCode);
  }
  function deriveBorrowerAddress(bytes32 salt) internal view returns (address) {
    return Create2.computeAddress(salt, keccak256(type(ShifterBorrowProxy).creationCode));
  }
}
