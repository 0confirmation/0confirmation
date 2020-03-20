pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterPool } from "./ShifterPool.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { ILiquidationModule } from "./interfaces/ILiquidationModule.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";
import { LiquidityToken } from "./LiquidityToken.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract ShifterBorrowProxy is BorrowProxy {
  using ShifterBorrowProxyLib for *;
  using TokenUtils for *;
  constructor() BorrowProxy() public {}
  function repayLoan(bytes memory data) public returns (bool) {
    (ShifterBorrowProxyLib.TriggerParcel memory parcel) = abi.decode(data, (ShifterBorrowProxyLib.TriggerParcel));
    require(validateProxyRecord(abi.encode(parcel.record)));
    require(!isolate.isLiquidating);
    uint256 amount = ShifterPool(isolate.masterAddress).getShifterHandler(parcel.record.request.token).shiftIn(parcel.pHash, parcel.record.request.amount, parcel.computeNHash(), parcel.darknodeSignature);
    uint256 fee = parcel.record.computeAdjustedKeeperFee(amount);
    isolate.unbound = true;
    LiquidityToken liquidityToken = ShifterPool(isolate.masterAddress).getLiquidityTokenHandler(parcel.record.request.token);
    require(parcel.record.request.token.sendToken(address(liquidityToken), amount - fee));
    require(parcel.record.request.token.sendToken(parcel.record.loan.keeper, fee));
    require(ShifterPool(isolate.masterAddress).relayResolveLoan(parcel.record.request.token, address(liquidityToken), parcel.record.loan.keeper, parcel.record.loan.params.bond, 0), "loan resolution notification failed");
    emit ShifterBorrowProxyLib.ShifterBorrowProxyRepaid(parcel.record.request.borrower, parcel.record);
  }
  function defaultLoan(bytes memory data) public returns (bool) {
    require(validateProxyRecord(data));
    (ShifterBorrowProxyLib.ProxyRecord memory record) = abi.decode(data, (ShifterBorrowProxyLib.ProxyRecord));
    address[] memory set = isolate.liquidationSet.set;
    if (record.loan.params.timeoutExpiry >= block.number) {
      if (!isolate.isLiquidating) isolate.preBalance = IERC20(record.request.token).balanceOf(address(this));
      isolate.isLiquidating = true;
      for (uint256 i = isolate.liquidationIndex; i < set.length; i++) {
        if (gasleft() < 3e5 || !set[i].delegateLiquidate()) {
          isolate.liquidationIndex = i;
          return false;
        }
      }
      isolate.liquidationIndex = set.length;
      ShifterPool pool = ShifterPool(isolate.masterAddress);
      uint256 preBalance = isolate.preBalance;
      uint256 postBalance = IERC20(record.request.token).balanceOf(address(this));
      int256 reclaimed = int256(postBalance) - int256(preBalance);
      uint256 repay = uint256(int256(record.request.amount) - (reclaimed < 0 ? 0 : reclaimed));
      require(pool.relayResolveLoan(record.request.token, address(pool.getLiquidityTokenHandler(record.request.token)), record.loan.keeper, record.request.amount - repay, repay));
      return true;
    }
    return false;
  }
}
