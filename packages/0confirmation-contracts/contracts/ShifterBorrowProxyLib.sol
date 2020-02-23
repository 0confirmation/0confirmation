pragma solidity ^0.6.2;

library ShifterBorrowProxyLib {
  struct ProxyRecord {
    address token;
    RenVMShiftMessage message;
    LenderRecord record;
  }
  struct TriggerParcel {
    ProxyRecord record;
    bytes darknodeSignature;
  }
  struct LenderRecord {
    uint256 amount;
    address keeper;
    uint256 poolFee;
    uint256 keeperFee;
  }
  function computePostFee(LenderRecord memory record) internal pure returns (uint256) {
    return record.amount.sub(computePoolFee(record).add(computeKeeperFee(record)));
  }
  function computePoolFee(LenderRecord memory record) internal pure returns (uint256) {
    return record.amount.mul(record.poolFee).div(uint256(1 ether));
  }
  function computeKeeperFee(LenderRecord memory record) internal pure returns (uint256) {
    return record.amount.mul(record.keeperFee).div(uint256(1 ether));
  }
  function computeAdjustedKeeperFee(LenderRecord memory record, uint256 actual) internal pure returns (uint256) {
    return actual.mul(record.keeperFee).div(uint256(1 ether));
  }
}
