// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenQueryLib } from "./TokenQueryLib.sol";
import { QueryLib } from "../lib/QueryLib.sol";

contract TokenQuery {
  using TokenQueryLib for *;
  using QueryLib for *;
  event TokenQueryPayloadExport(TokenQueryLib.TokenQueryPayload payload);
  constructor(TokenQueryLib.TokenQueryPayload[] memory payload) public {
    TokenQueryLib.TokenQueryResult[] memory result = new TokenQueryLib.TokenQueryResult[](payload.length);
    for (uint256 i = 0; i < payload.length; i++) {
      result[i] = payload[i].executeQuery();
    }
    result.encodeResult().returnBytes();
  }
}
