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
    address borrower;
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
  function computeLiquidityRequestHash(LiquidityRequestParcel memory parcel) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(parcel.request.token, parcel.request.nonce, parcel.request.amount, parcel.gasRequested));
  }
  function validateSignature(LiquidityRequestParcel memory parcel, bytes32 hash) internal pure returns (bool) {
    return parcel.request.borrower == ECDSA.recover(hash, parcel.signature);
  }
  struct TriggerParcel {
    ProxyRecord record;
    bytes32 txhash;
    bytes32 vout;
    bytes32 pHash;
    bytes darknodeSignature;
  }
  function computeNHash(TriggerParcel memory parcel) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(parcel.request.nonce, parcel.txhash, parcel.vout));
  }
  function computePostFee(LenderRecord memory record) internal pure returns (uint256) {
    return record.amount.sub(computePoolFee(record).add(computeKeeperFee(record)));
  }
  function computePoolFee(LenderRecord memory record) internal pure returns (uint256) {
    return record.amount.mul(record.params.poolFee).div(uint256(1 ether));
  }
  function computeKeeperFee(LenderRecord memory record) internal pure returns (uint256) {
    return record.amount.mul(record.params.keeperFee).div(uint256(1 ether));
  }
  function computeAdjustedKeeperFee(LenderRecord memory record, uint256 actual) internal pure returns (uint256) {
    return actual.mul(record.params.keeperFee).div(uint256(1 ether));
  }
}
