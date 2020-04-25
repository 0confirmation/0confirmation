pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxy } from "./BorrowProxy.sol";
import { ShifterPool } from "./ShifterPool.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { ILiquidationModule } from "./interfaces/ILiquidationModule.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";
import { LiquidityToken } from "./LiquidityToken.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { SafeViewExecutor } from "./utils/sandbox/SafeViewExecutor.sol";
import { SandboxLib } from "./utils/sandbox/SandboxLib.sol";

contract ShifterBorrowProxy is BorrowProxy, SafeViewExecutor {
  using ShifterBorrowProxyLib for *;
  using SandboxLib for *;
  using TokenUtils for *;
  constructor() BorrowProxy() public {}
  uint256 constant MINIMUM_GAS_CONTINUE = 5e5;
  function repayLoan(bytes memory data) public returns (bool) {
    (ShifterBorrowProxyLib.TriggerParcel memory parcel) = data.decodeTriggerParcel();
    require(validateProxyRecord(parcel.record.encodeProxyRecord()), "proxy record invalid");
    require(!isolate.isLiquidating, "proxy is being liquidated");
    uint256 fee = parcel.record.computeAdjustedKeeperFee(parcel.record.request.amount);
    LiquidityToken liquidityToken = ShifterPool(isolate.masterAddress).getLiquidityTokenHandler(parcel.record.request.token);
    uint256 amount;
    if (!isolate.isRepaying) {
      isolate.isRepaying = true;
      isolate.actualizedShift = amount = ShifterPool(isolate.masterAddress).getShifterHandler(parcel.record.request.token).mint(parcel.pHash, parcel.record.request.amount, parcel.computeNHash(), parcel.darknodeSignature);
      require(parcel.record.request.token.sendToken(address(liquidityToken), amount - fee), "token transfer failed");
    } else amount = isolate.actualizedShift;
    address[] memory set = isolate.repaymentSet.set;
    for (uint256 i = isolate.repaymentIndex; i < set.length; i++) {
      if (gasleft() < MINIMUM_GAS_CONTINUE || !set[i].delegateRepay()) {
        isolate.repaymentIndex = i;
        return false;
      }
    }
    isolate.unbound = true;
    require(parcel.record.request.token.sendToken(parcel.record.loan.keeper, fee), "keeper payout failed");
    require(ShifterPool(isolate.masterAddress).relayResolveLoan(parcel.record.request.token, address(liquidityToken), parcel.record.loan.keeper, parcel.record.loan.params.bond, 0), "loan resolution notification failed");
    ShifterBorrowProxyLib.emitShifterBorrowProxyRepaid(parcel.record.request.borrower, parcel.record);
    return true;
  }
  function defaultLoan(bytes memory data) public returns (bool) {
    require(!isolate.isRepaying, "loan being repaid");
    require(!isolate.unbound, "loan already repaid");
    require(validateProxyRecord(data), "proxy record invalid");
    ShifterBorrowProxyLib.ProxyRecord memory record = data.decodeProxyRecord();
    address[] memory set = isolate.liquidationSet.set;
    if (record.loan.params.timeoutExpiry >= block.number) {
      isolate.isLiquidating = true;
      for (uint256 i = isolate.liquidationIndex; i < set.length; i++) {
        if (gasleft() < MINIMUM_GAS_CONTINUE || !set[i].delegateLiquidate()) {
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
  function receiveInitializationActions(ShifterBorrowProxyLib.InitializationAction[] memory actions) public {
    require(msg.sender == address(isolate.masterAddress), "must be called from shifter pool");
    SandboxLib.ProtectedExecution[] memory trace = actions.processActions();
    ShifterBorrowProxyLib.emitBorrowProxyInitialization(address(this), trace);
  }
  fallback() external payable override {}
  receive() external payable override {}
}
