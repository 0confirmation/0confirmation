pragma solidity ^0.6.2;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { BorrowProxy } from "./BorrowProxy.sol";

library BorrowProxyFactoryLib {
  function deployBorrowProxy(bytes32 salt) internal returns (address output) {
    bytes memory creationCode = type(BorrowProxy).creationCode;
    return Create2.deploy(salt, creationCode);
  }
  function deriveBorrowerAddress(bytes32 salt) internal view returns (address) {
    return Create2.computeAddress(salt, keccak256(type(BorrowProxy).creationCode));
  }
}
