pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { ShifterBorrowProxy } from "./ShifterBorrowProxy.sol";
import { ShifterPoolLib } from "./ShifterPoolLib.sol";

library ShifterBorrowProxyFactoryLib {
  function deployBorrowProxy(ShifterPoolLib.Isolate storage /* isolate */, bytes32 salt) external returns (address output) {
    output = Create2.deploy(0, salt, type(ShifterBorrowProxy).creationCode);
  }
  function deriveBorrowerAddress(address target, bytes32 salt) external view returns (address) {
    return Create2.computeAddress(salt, keccak256(computeCreationCode(target)));
  }
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
}
