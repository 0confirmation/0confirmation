pragma solidity ^0.6.3;

import { ShifterBorrowProxy } from "../../ShifterBorrowProxy.sol";

/* You need this because truffle won't build the creation code that is returned by type(ShifterBorrowProxy).creationCode .. the bytecode it provides requires linking with the BorrowProxyLib, but even if you link it, this doesn't give you the same init code .. we just need the hash anyway */

contract GetShifterBorrowProxyInitCodeHash {
  constructor() public {
    bytes memory creationCode = type(ShifterBorrowProxy).creationCode;
    bytes32 codeHash = keccak256(creationCode);
    assembly {
      mstore(0x0, codeHash)
      return(0x0, 0x20)
    }
  }
}
