pragma solidity ^0.6.0;

import { ShifterPoolQuery } from "./ShifterPoolQuery.sol";

contract FeeViewQuery is ShifterPoolQuery {
  function execute(bytes memory /* context */) view public returns (uint256 poolFee, uint256 daoFee) {
    poolFee = isolate.poolFee;
    daoFee = isolate.daoFee;
  }
}
