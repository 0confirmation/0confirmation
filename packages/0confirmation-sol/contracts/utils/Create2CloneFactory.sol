pragma solidity ^0.6.0;

import { ShifterBorrowProxyFactoryLib } from "../ShifterBorrowProxyFactoryLib.sol";

abstract contract Create2CloneFactory {

    function cloneConstructor(bytes calldata consData) external virtual;
    function create2Clone(address target, uint saltNonce) internal returns (address result) {
        bytes memory clone = ShifterBorrowProxyFactoryLib.computeCreationCode(target);
        bytes32 salt = bytes32(saltNonce);
        
        assembly {
          let len := mload(clone)
          let data := add(clone, 0x20)
          result := create2(0, data, len, salt)
        }
        
        require(result != address(0), "create2 failed");
    }
}
