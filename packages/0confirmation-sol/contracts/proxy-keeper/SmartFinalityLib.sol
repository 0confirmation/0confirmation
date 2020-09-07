// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

library SmartFinalityLib {
  enum FinalityState {
    UNINITIALIZED,
    AWAITING_ORACLE,
    SUFFICIENT_CONFIRMATIONS,
    INSUFFICIENT_CONFIRMATIONS 
  }
  struct FinalityCheckRecord {
    FinalityState state;
    address proxiedKeeper;
    uint256 bond;
    uint256 amount;
  }
}
