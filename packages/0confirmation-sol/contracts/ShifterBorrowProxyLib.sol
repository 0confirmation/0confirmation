pragma solidity ^0.6.2;

import { ECDSA } from "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
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
  struct LiquidityRequestParcel {
    LiquidityRequest request;
    uint256 gasRequested;
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
  function computeBorrowerSalt(LiquidityRequest memory params) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(params.borrower, params.token, params.nonce, params.amount));
  }
  function computeLiquidityRequestHash(LiquidityRequestParcel memory parcel) internal view returns (bytes32) {
    return keccak256(abi.encodePacked(address(this), parcel.request.token, parcel.request.nonce, parcel.request.amount, parcel.gasRequested));
  }
  function validateSignature(LiquidityRequestParcel memory parcel, bytes32 hash) internal pure returns (bool) {
    return parcel.request.borrower == ECDSA.recover(ECDSA.toEthSignedMessageHash(hash), parcel.signature);
  }
  struct TriggerParcel {
    ProxyRecord record;
    bytes32 txhash;
    bytes32 vout;
    bytes32 pHash;
    bytes darknodeSignature;
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
