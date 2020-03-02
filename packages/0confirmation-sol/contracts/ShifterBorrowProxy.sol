pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterPool } from "./ShifterPool.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { ILiquidationModule } from "./interfaces/ILiquidationModule.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";
import { LiquidityToken } from "./LiquidityToken.sol";

contract ShifterBorrowProxy is BorrowProxy {
  using ShifterBorrowProxyLib for *;
  using TokenUtils for *;
  constructor() BorrowProxy() public {}
  function repayLoan(bytes memory data) public returns (bool) {
    (ShifterBorrowProxyLib.TriggerParcel memory parcel) = abi.decode(data, (ShifterBorrowProxyLib.TriggerParcel));
    require(validateProxyRecord(abi.encode(parcel.record)));
    require(!isolate.isLiquidating);
    uint256 amount = ShifterPool(isolate.masterAddress).getShifterHandler(parcel.record.token).shiftIn(parcel.record.message.pHash, parcel.record.message.amount, parcel.record.message.nHash, parcel.darknodeSignature);
    uint256 fee = parcel.record.loan.computeAdjustedKeeperFee(amount);
    isolate.unbound = true;
    LiquidityToken liquidityToken = ShifterPool(isolate.masterAddress).getLiquidityTokenHandler(parcel.record.token);
    require(parcel.record.token.sendToken(address(liquidityToken), amount - fee));
    require(parcel.record.token.sendToken(parcel.record.loan.keeper, fee));
    require(ShifterPool(isolate.masterAddress).relayResolveLoan(address(liquidityToken)));
  }
  function defaultLoan(bytes memory data) public returns (bool) {
    require(validateProxyRecord(data));
    (ShifterBorrowProxyLib.ProxyRecord memory record) = abi.decode(data, (ShifterBorrowProxyLib.ProxyRecord));
    address[] memory set = isolate.liquidationSet.set;
    if (record.timeoutExpiry >= block.number) {
      isolate.isLiquidating = true;
      for (uint256 i = isolate.liquidationIndex; i < set.length; i++) {
        if (gasleft() < 3e5 || !set[i].delegateLiquidate()) {
          isolate.liquidationIndex = i;
          return false;
        }
      }
      isolate.liquidationIndex = set.length;
      ShifterPool pool = ShifterPool(isolate.masterAddress);
      require(pool.relayResolveLoan(address(pool.getLiquidityTokenHandler(record.token))));
      return true;
    }
    return false;
  }
}
