pragma solidity ^0.6.0;

import { MemcpyLib } from "./MemcpyLib.sol";

library SliceLib {
  struct Slice {
    uint256 data;
    uint256 length;
    uint256 offset;
  }
  function toSlice(bytes memory input, uint256 offset, uint256 length) internal pure returns (Slice memory retval) {
    uint256 data;
    assembly {
      data := add(offset, add(input, 0x20))
    }
    retval.data = data;
    retval.length = length;
    retval.offset = offset;
  }
  function toSlice(bytes memory input) internal pure returns (Slice memory) {
    return toSlice(input, 0);
  }
  function toSlice(bytes memory input, uint256 offset) internal pure returns (Slice memory) {
    if (input.length < offset) offset = input.length;
    return toSlice(input, offset, input.length - offset);
  }
  function toSlice(Slice memory input, uint256 offset, uint256 length) internal pure returns (Slice memory) {
    return Slice({
      data: input.data + offset,
      offset: input.offset + offset,
      length: length
    });
  }
  function toSlice(Slice memory input, uint256 offset) internal pure returns (Slice memory) {
    return toSlice(input, offset, input.length - offset);
  }
  function toSlice(Slice memory input) internal pure returns (Slice memory) {
    return toSlice(input, 0);
  }
  function get(Slice memory slice, uint256 index) internal pure returns (bytes1 result) {
    uint256 data = slice.data - 0x1f + index;
    uint8 intermediate;
    assembly {
      intermediate := and(mload(data), 0xff)
    }
    result = bytes1(intermediate);
  }
  function set(Slice memory slice, uint256 index, uint8 value) internal pure {
    uint256 data = slice.data + index;
    assembly {
      mstore8(data, value)
    }
  }
  function asWord(Slice memory slice) internal pure returns (bytes32 word) {
    uint256 data = slice.data;
    uint256 length = slice.length;
    assembly {
      let mask := sub(shl(mul(length, 0x8), 0x1), 0x1)
      word := and(mload(sub(data, sub(0x20, length))), mask)
    }
  }
  function copy(Slice memory slice) internal pure returns (bytes memory retval) {
    uint256 length = slice.length;
    retval = new bytes(length);
    bytes32 src = bytes32(slice.data);
    bytes32 dest;
    assembly {
      dest := add(retval, 0x20)
    }
    MemcpyLib.memcpy(dest, src, length);
  }
  function toKeccak(Slice memory slice) internal pure returns (bytes32 result) {
    uint256 length = slice.length;
    uint256 data = slice.data;
    assembly {
      result := keccak256(data, length)
    }
  }
}
