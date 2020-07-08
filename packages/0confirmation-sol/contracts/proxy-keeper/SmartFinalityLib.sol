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
  function stringToUint(string s) constant returns (uint256 result) {
    bytes memory b = bytes(s);
    uint256 result = 0;
    for (uint256 i = 0; i < b.length; i++) {
      if (b[i] >= 48 && b[i] <= 57) {
        result = result * 10 + (uint(b[i]) - 48);
      }
    }
  }
}
