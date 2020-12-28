// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { ShifterPool } from "../ShifterPool.sol";
import { FeeViewQuery } from "./FeeViewQuery.sol";

contract FeeView {
  address public shifterPool;
  constructor(address _shifterPool) public {
    shifterPool = _shifterPool;
  }
  function getFees() public view returns (uint256 poolFee, uint256 daoFee) {
    bytes memory result = ShifterPool(shifterPool).query(type(FeeViewQuery).bytecode, new bytes(0))
    (poolFee, daoFee) = abi.decode(result, (uint256, uint256));
  }
}
