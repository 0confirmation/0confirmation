pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { ChainlinkClient } from "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

import { SmartFinalityLib } from "./SmartFinalityLib.sol";
import { SmartFinalityProxyKeeperLib } from "./SmartFinalityProxyKeeperLib.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";
import { StringLib } from "../utils/StringLib.sol";

contract SmartFinalityProxyKeeper is ChainlinkClient {
  using SmartFinalityProxyKeeperLib for *;
  using StringLib for *;
  SmartFinalityProxyKeeperLib.Isolate public isolate;
  constructor(address shifterPool, uint256 confirmationThreshold, address link) public {
    isolate.shifterPool = shifterPool;
    isolate.confirmationThreshold = confirmationThreshold;
    if (link != address(0x0)) setChainlinkToken(link);
    else setPublicChainlinkToken();
  }
  function queryOracleConfirmations(ShifterBorrowProxyLib.LiquidityRequestParcel memory parcel, address mpkh, bool btcTestnet, uint256 bond) public {
    bytes32 salt = parcel.computeBorrowerSalt();
    address proxyAddress = isolate.computeProxyAddress(salt);
    bytes32 jobId = isolate.getNextId();
    SmartFinalityLib.FinalityRecord storage record = isolate.finalityCheck[proxyAddress];
    require(record.state == SmartFinalityLib.FinalityState.UNINITIALIZED || record.state == SmartFinalityLib.FinalityState.INSUFFICIENT_CONFIRMATIONS, "oracle request still in progress, or already resolved with sufficient confirmations");
    record = SmartFinalityLib.FinalityRecord({
      proxiedKeeper: record.proxiedKeeper,
      bond: record.bond,
      amount: parcel.request.amount,
      state: SmartFinalityLib.FinalityState.AWAITING_ORACLE
    });
    Chainlink.Request memory req = buildChainlinkRequest(
      jobId,
      address(this),
      this.fulfillCheckConfirmations.selector
    )
    req.add(
      "get",
      abi.encodePacked(
        "https://blockchain.info/q/getreceivedbyaddress/",
        parcel.computeDepositAddress(mpkh, btcTestnet),
        "?confirmations=",
        isolate.confirmationThreshold.toString()
      ).toString()
    );
    bytes32 requestId = sendChainlinkRequest(req, 1 * LINK);
    isolate.reqIdToAddress[requestId] = proxyAddress; 
  }
  function fulfillCheckConfirmations(bytes32 requestId, uint256 value) public recordChainlinkFulfillment(requestId) {
    address proxyAddress = isolate.reqIdToAddress[requestId];
    SmartFinalityLib.FinalityRecord storage record = isolate.finalityCheck[proxyAddress];
    if (value >= record.amount) record.state = SmartFinalityLib.FinalityState.SUFFICIENT_CONFIRMATIONS;
    else record.state = SmartFinalityLib.FinalityState.INSUFFICIENT_CONFIRMATIONS;
  }
  function peekFinalityRecord(address proxyAddress) public view returns (SmartFinalityLib.FinalityState, address, uint256, uint256) {
    SmartFinalityLib.FinalityRecord storage record = isolate.finalityCheck[proxyAddress];
    return (record.state, record.proxiedKeeper, record.bond, record.amount);
  }
}
  
    
