pragma solidity ^0.6.0;

import { BitcoinScriptLib } from "./BitcoinScriptLib.sol";

library DepositAddressCalculatorLib {
  function addressToBytes(address input) internal returns (bytes memory buffer) {
    buffer = new bytes(20);
    bytes20 word = bytes20(uint160(input));
    assembly {
      mstore(add(0x20, buffer), word)
    }
  }
  function bytes32ToBytes(bytes32 input) internal pure returns (bytes memory buffer) {
    buffer = new bytes(32);
    assembly {
      mstore(add(0x20, buffer), input)
    }
  }
  function computeGHash(address to, address tokenAddress, bytes32 pHash, bytes32 nonce) internal pure returns (bytes32 result) {
    result = keccak256(abi.encode(pHash, tokenAddress, to, nonce));
  }
  function assembleMintScript(bytes32 gHash, address mpkh, bool isTestnet) internal pure returns (bytes memory) {
    BitcoinScriptLib.Script memory script = BitcoinScriptLib.newScript(0x3d)
      .add(bytes32ToBytes(gHash))
      .add(BitcoinScriptLib.OP_DROP())
      .add(BitcoinScriptLib.OP_DUP())
      .add(BitcoinScriptLib.OP_HASH160())
      .add(addressToBytes(mpkh))
      .add(BitcoinScriptLib.OP_EQUALVERIFY())
      .add(BitcoinScriptLib.OP_CHECKSIG())
      .toScriptHashOut()
      .toAddress(isTestnet)
      .toBase64();
    }
  }
}
