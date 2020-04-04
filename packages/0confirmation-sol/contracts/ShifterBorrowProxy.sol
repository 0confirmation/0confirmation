pragma solidity ^0.6.0;
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
    require(validateProxyRecord(abi.encode(parcel.record)), "proxy record invalid");
    require(!isolate.isLiquidating, "proxy is being liquidated");
    uint256 amount = ShifterPool(isolate.masterAddress).getShifterHandler(parcel.record.request.token).shiftIn(parcel.pHash, parcel.record.request.amount, parcel.computeNHash(), parcel.darknodeSignature);
    uint256 fee = parcel.record.computeAdjustedKeeperFee(amount);
    isolate.unbound = true;
    LiquidityToken liquidityToken = ShifterPool(isolate.masterAddress).getLiquidityTokenHandler(parcel.record.request.token);
    require(parcel.record.request.token.sendToken(address(liquidityToken), amount - fee), "token transfer failed");
    require(parcel.record.request.token.sendToken(parcel.record.loan.keeper, fee), "keeper payout failed");
    require(ShifterPool(isolate.masterAddress).relayResolveLoan(parcel.record.request.token, address(liquidityToken), parcel.record.loan.keeper, parcel.record.loan.params.bond, 0), "loan resolution notification failed");
    ShifterBorrowProxyLib.emitShifterBorrowProxyRepaid(parcel.record.request.borrower, parcel.record);
  }
  function defaultLoan(bytes memory data) public returns (bool) {
    require(validateProxyRecord(data), "proxy record invalid");
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
      uint256 postBalance = IERC20(record.request.token).balanceOf(address(this));
      require(record.request.token.sendToken(address(pool), postBalance), "failed to transfer reclaimed funds to pool");
      uint256 bond = record.loan.params.bond;
      if (postBalance < record.request.amount) {
        if (bond > postBalance - record.request.amount) {
          bond -= (postBalance - record.request.amount);
        } else {
          bond = 0;
        }
      }
      uint256 repay = postBalance - bond;
      require(pool.relayResolveLoan(record.request.token, address(pool.getLiquidityTokenHandler(record.request.token)), record.loan.keeper, bond, repay), "loan resolution failure");
      return true;
    }
    return false;
  }
  fallback() external payable override {}
  receive() external payable override {}
}
