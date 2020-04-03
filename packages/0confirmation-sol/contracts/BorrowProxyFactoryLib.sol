pragma solidity ^0.6.2;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { BorrowProxy } from "./BorrowProxy.sol";

library BorrowProxyFactoryLib {
  event Debug(address indexed self, bytes32 indexed salt);
  function deployBorrowProxy(bytes32 salt) internal returns (address output) {
    emit Debug(address(this), salt);
    return Create2.deploy(0, salt, type(BorrowProxy).creationCode);
  }
  function deriveBorrowerAddress(bytes32 salt) internal view returns (address) {
    return Create2.computeAddress(salt, keccak256(type(BorrowProxy).creationCode));
  }
}
