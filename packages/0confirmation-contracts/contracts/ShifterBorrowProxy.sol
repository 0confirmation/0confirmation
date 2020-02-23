pragma solidity ^0.6.2;

import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterPool } from "./ShifterPool.sol";

contract ShifterBorrowProxy is BorrowProxy {
  constructor() BorrowProxy() public {}
  function repayLoan(bytes memory data) internal returns (bool) {
    (ShifterBorrowProxyLib.TriggerParcel memory parcel) = abi.decode(data, (ShifterBorrowProxyLib.TriggerParcel));
    require(validateProxyRecord(abi.encode(parcel.record)));
    require(!isolate.isLiquidating);
    uint256 amount = ShifterPool(isolate.masterAddress).getShifter(record.token).shiftIn(record.message.pHash, record.message.amount, record.message.nHash, parcel.darknodeSignature);
    uint256 fee = record.loan.computeAdjustedKeeperFee(amount);
    isolate.unbound = true;
    require(record.token.sendToken(isolate.masterAddress, amount - fee));
    require(record.token.sendToken(record.loan.keeper, fee));
  }
  function defaultLoan(bytes memory data) public returns (bool) {
    require(validateProxyRecord(data));
    (ShifterBorrowProxyLib.ProxyRecord memory record) = abi.decode(data, (ShifterBorrowProxyLib.ProxyRecord));
    address[] memory set = isolate.liquidationSet.set;
    if (record.timeoutExpiry >= block.number) {
      isolate.isLiquidating = true;
      for (uint256 i = isolate.liquidationIndex; i < set.length; i++) {
        if (gasleft() < 3e5 || !ILiquidationModule(set[i]).liquidate.delegatecall(set[i])) {
          isolate.isLiquidating = i;
          return false;
        }
      }
      isolate.liquidationIndex = set.length;
      return true;
    }
    return false;
  }
}
