pragma solidity ^0.6.0;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";

library FactoryLib {
  function computeCreationCode(address target) internal view returns (bytes memory clone) {
      bytes memory consData = abi.encodeWithSignature("cloneConstructor(bytes)", new bytes(0));
      clone = new bytes(99 + consData.length);
      assembly {
        mstore(add(clone, 0x20),
           0x3d3d606380380380913d393d73bebebebebebebebebebebebebebebebebebebe)
        mstore(add(clone, 0x2d),
           mul(address(), 0x01000000000000000000000000))
        mstore(add(clone, 0x41),
           0x5af4602a57600080fd5b602d8060366000396000f3363d3d373d3d3d363d73be)
           mstore(add(clone, 0x60),
           mul(target, 0x01000000000000000000000000))
        mstore(add(clone, 116),
           0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      }
      for (uint256 i = 0; i < consData.length; i++) {
        clone[i + 99] = consData[i];
      }
  }
  function deriveInstanceAddress(address target, bytes32 salt) internal view returns (address) {
    return Create2.computeAddress(salt, keccak256(computeCreationCode(target)));
  }
  function deriveInstanceAddress(address from, address target, bytes32 salt) internal view returns (address) {
     return Create2.computeAddress(salt, keccak256(computeCreationCode(target)), from);
  }
  function create2Clone(address target, uint saltNonce) internal returns (address result) {
    bytes memory clone = computeCreationCode(target);
    bytes32 salt = bytes32(saltNonce);
      
    assembly {
      let len := mload(clone)
      let data := add(clone, 0x20)
      result := create2(0, data, len, salt)
    }
      
    require(result != address(0), "create2 failed");
  }
}
