pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenQueryLib } from "./TokenQueryLib.sol";

contract TokenQuery {
  using TokenQueryLib for *;
  event TokenQueryPayloadExport(TokenQueryLib.TokenQueryPayload payload);
  constructor(TokenQueryLib.TokenQueryPayload[] memory payload) public {
    TokenQueryLib.TokenQueryResult[] memory result = new TokenQueryLib.TokenQueryResult[](payload.length);
    for (uint256 i = 0; i < payload.length; i++) {
      result[i] = payload[i].executeQuery();
    }
    bytes memory retval = abi.encode(result);
    assembly {
      return(add(retval, 0x20), mload(retval))
    }
  }
}
