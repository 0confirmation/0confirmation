pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ECDSA } from "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";

library ShifterBorrowProxyLib {
  using SafeMath for *;
  using TokenUtils for *;
  struct ProxyRecord {
    LiquidityRequest request;
    LenderRecord loan;
  }
  struct LiquidityRequest {
    address payable borrower;
    address token;
    bytes32 nonce;
    uint256 amount;
  }
  struct InitializationAction {
    address to;
    bytes txData;
  }
  function encodeProxyRecord(ProxyRecord memory record) internal pure returns (bytes memory) {
    return abi.encode(record);
  }
  function decodeProxyRecord(bytes memory record) internal pure returns (ProxyRecord memory result) {
    (result) = abi.decode(record, (ProxyRecord));
  }
  struct LiquidityRequestParcel {
    LiquidityRequest request;
    uint256 gasRequested;
    InitializationAction[] actions;
    bytes signature;
  }
  struct LenderParams {
    uint256 timeoutExpiry;
    uint256 bond;
    uint256 poolFee;
    uint256 keeperFee;
  }
  struct LenderRecord {
    address keeper;
    LenderParams params;
  }
  event ShifterBorrowProxyRepaid(address indexed user, ProxyRecord record);
  function emitShifterBorrowProxyRepaid(address user, ProxyRecord memory record) internal {
    emit ShifterBorrowProxyRepaid(user, record);
  }
  function triggerAction(InitializationAction memory action, address proxyAddress) internal returns (bool) {
    (bool success, ) = proxyAddress.call{ gas: gasleft() }(abi.encodeWithSelector(BorrowProxy.proxy.selector, action.to, 0, action.txData));
    return success;
  }
  function triggerActions(InitializationAction[] memory actions, address proxyAddress) internal returns (bool) {
    for (uint256 i = 0; i < actions.length; i++) {
      if (!triggerAction(actions[i], proxyAddress)) return false;
    }
    return true;
  }
  function computeBorrowerSalt(LiquidityRequest memory params) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(params.borrower, params.token, params.nonce, params.amount));
  }
  function encodeParcelActions(InitializationAction[] memory actions) internal pure returns (bytes memory) {
    return abi.encode(actions);
  }
  function computeLiquidityRequestHash(LiquidityRequestParcel memory parcel) internal view returns (bytes32) {
    return keccak256(abi.encodePacked(address(this), parcel.request.token, parcel.request.nonce, parcel.request.amount, parcel.gasRequested, encodeParcelActions(parcel.actions)));
  }
  function validateSignature(LiquidityRequestParcel memory parcel, bytes32 hash) internal pure returns (bool) {
    return parcel.request.borrower == ECDSA.recover(ECDSA.toEthSignedMessageHash(hash), parcel.signature);
  }
  struct TriggerParcel {
    ProxyRecord record;
    bytes32 txhash;
    uint256 vout;
    bytes32 pHash;
    bytes darknodeSignature;
  }
  function decodeTriggerParcel(bytes memory parcel) internal pure returns (TriggerParcel memory result) {
    (result) = abi.decode(parcel, (TriggerParcel));
  }
  function computeNHash(TriggerParcel memory parcel) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(parcel.record.request.nonce, parcel.txhash, parcel.vout));
  }
  function computePostFee(ProxyRecord memory record) internal pure returns (uint256) {
    return record.request.amount.sub(computePoolFee(record).add(computeKeeperFee(record)));
  }
  function computePoolFee(ProxyRecord memory record) internal pure returns (uint256) {
    return record.request.amount.mul(record.loan.params.poolFee).div(uint256(1 ether));
  }
  function computeKeeperFee(ProxyRecord memory record) internal pure returns (uint256) {
    return record.request.amount.mul(record.loan.params.keeperFee).div(uint256(1 ether));
  }
  function computeAdjustedKeeperFee(ProxyRecord memory record, uint256 actual) internal pure returns (uint256) {
    return actual.mul(record.loan.params.keeperFee).div(uint256(1 ether));
  }
}
