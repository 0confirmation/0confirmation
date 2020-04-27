pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

library ExtLib {
  function getExtCodeHash(address target) internal view returns (bytes32 result) {
    assembly {
      result := extcodehash(target)
    }
  }
}
