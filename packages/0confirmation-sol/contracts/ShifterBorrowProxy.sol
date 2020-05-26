// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenUtils } from "./utils/TokenUtils.sol";
import { LiquidityToken } from "./LiquidityToken.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeViewExecutor } from "./utils/sandbox/SafeViewExecutor.sol";
import { SandboxLib } from "./utils/sandbox/SandboxLib.sol";
import { StringLib } from "./utils/StringLib.sol";
import { NullCloneConstructor } from "./NullCloneConstructor.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { ShifterPool } from "./ShifterPool.sol";
import { IShifter } from "./interfaces/IShifter.sol";

contract ShifterBorrowProxy is BorrowProxy, SafeViewExecutor, NullCloneConstructor {
  using ShifterBorrowProxyLib for *;
  using StringLib for *;
  using SandboxLib for *;
  using TokenUtils for *;
  uint256 constant MINIMUM_GAS_CONTINUE = 5e5;
  function getShifter(address token) internal view returns (IShifter shifter) {
    shifter = ShifterPool(isolate.masterAddress).getShifterHandler(token);
  }
  function mint(ShifterBorrowProxyLib.TriggerParcel memory parcel) internal returns (uint256 amount) {
    amount = getShifter(parcel.record.request.token).mint(parcel.shiftParameters.pHash, parcel.record.request.amount, parcel.computeNHash(), parcel.shiftParameters.darknodeSignature);
  }
  function repayLoan(bytes memory data) public returns (bool) {
    (bool success, ShifterBorrowProxyLib.ProxyRecord memory record, address pool) = _repayLoan(data);
    if (maybeRelayResolveLoan(success, record, pool, record.loan.params.bond)) {
      ShifterBorrowProxyLib.emitShifterBorrowProxyRepaid(record.request.borrower, record);
      return true;
    } else return false;
  }
  function _repayLoan(bytes memory data) internal returns (bool success, ShifterBorrowProxyLib.ProxyRecord memory record, address pool) {
    (ShifterBorrowProxyLib.TriggerParcel memory parcel) = data.decodeTriggerParcel();
    record = parcel.record;
    parcel.record.request.actions = new ShifterBorrowProxyLib.InitializationAction[](0);
    require(validateProxyRecord(parcel.record.encodeProxyRecord()), "proxy record invalid");
    require(!isolate.isLiquidating, "proxy is being liquidated");
    uint256 fee = parcel.record.computeAdjustedKeeperFee(parcel.record.request.amount);
    pool = isolate.masterAddress;
    address liquidityToken = getLiquidityToken(pool, parcel.record.request.token);
    uint256 amount;
    if (!isolate.isRepaying) {
      isolate.isRepaying = true;
      isolate.actualizedShift = amount = mint(parcel);
      require(parcel.record.request.token.sendToken(liquidityToken, amount - fee), "token transfer failed");
    } else amount = isolate.actualizedShift;
    address[] memory set = isolate.repaymentSet.set;
    for (uint256 i = isolate.repaymentIndex; i < set.length; i++) {
      if (gasleft() < MINIMUM_GAS_CONTINUE || !set[i].delegateRepay()) {
        isolate.repaymentIndex = i;
        return (false, record, pool);
      }
    }
    isolate.unbound = true;
    require(parcel.record.request.token.sendToken(parcel.record.loan.keeper, fee), "keeper payout failed");
    success = true;
  }
  function getBalanceOf(address token, address user) internal view returns (uint256) {
    return IERC20(token).balanceOf(user);
  }
  function getLiquidityToken(address pool, address token) internal view returns (address liqToken) {
    liqToken = address(ShifterPool(pool).getLiquidityTokenHandler(token));
  }
  function maybeRelayResolveLoan(bool success, ShifterBorrowProxyLib.ProxyRecord memory record, address pool, uint256 postBalance) internal returns (bool) {
    if (success) {
      address liqToken = getLiquidityToken(pool, record.request.token);
      require(ShifterPool(pool).relayResolveLoan(record.request.token, liqToken, record.loan.keeper, record.loan.params.bond, postBalance - record.loan.params.bond), "loan resolution failure");
      return true;
    }
    return false;
  }
  function defaultLoan(bytes memory data) public returns (bool) {
    (bool success, ShifterBorrowProxyLib.ProxyRecord memory record, address pool, uint256 postBalance) = _defaultLoan(data);
    return maybeRelayResolveLoan(success, record, pool, postBalance);
  }
  function _defaultLoan(bytes memory data) internal returns (bool success, ShifterBorrowProxyLib.ProxyRecord memory record, address pool, uint256 postBalance) {
    require(!isolate.isRepaying, "loan being repaid");
    require(!isolate.unbound, "loan already repaid");
    require(validateProxyRecord(data), "proxy record invalid");
    record = data.decodeProxyRecord();
    address[] memory set = isolate.liquidationSet.set;
    if (record.loan.params.timeoutExpiry >= block.number) {
      isolate.isLiquidating = true;
      for (uint256 i = isolate.liquidationIndex; i < set.length; i++) {
        if (gasleft() < MINIMUM_GAS_CONTINUE) { //|| !set[i].delegateLiquidate()) {
          isolate.liquidationIndex = i;
          return (false, record, pool, postBalance); //|| !set[i].delegateLiquidate()) 
        }
      }
      isolate.liquidationIndex = set.length;
      pool = isolate.masterAddress;
      postBalance = getBalanceOf(record.request.token, pool);
      require(record.request.token.sendToken(pool, postBalance), "failed to transfer reclaimed funds to pool");
      if (postBalance < record.request.amount) {
        if (record.loan.params.bond > postBalance - record.request.amount) {
          record.loan.params.bond -= (postBalance - record.request.amount);
        } else {
          record.loan.params.bond = 0;
        }
      }
      success = true;
    } else {
      success = false;
    }
  }
  function receiveInitializationActions(ShifterBorrowProxyLib.InitializationAction[] memory actions) public {
    require(msg.sender == address(isolate.masterAddress), "must be called from shifter pool");
    actions.processActions();
  }
  fallback() external payable override {}
  receive() external payable override {}
}
