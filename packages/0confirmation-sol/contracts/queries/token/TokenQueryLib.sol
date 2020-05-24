// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ERC20Detailed } from "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface MissingERC20 {
  function allowance(address, address) external view returns (uint256);
}

library TokenQueryLib {
  struct DataResult {
    bool success;
    bytes value;
  }
  struct ApprovalQueryPayload {
    address payable sourceAddress;
    address payable targetAddress;
  }
  struct TokenQueryPayload {
    address payable token;
    address[] balanceQueries;
    ApprovalQueryPayload[] approvalQueries;
  }
  struct TokenQueryResult {
    DataResult name;
    DataResult symbol;
    DataResult decimals;
    DataResult[] balanceQueryResults;
    DataResult[] approvalQueryResults;
  }
  function callToken(address token, bytes memory payload) internal returns (DataResult memory) {
    (bool success, bytes memory value) = token.call(payload);
    return DataResult({
      success: success,
      value: value
    });
  }
  function encodeDecimals() internal pure returns (bytes memory retval) {
    retval = abi.encodePacked(ERC20Detailed.decimals.selector);
  }
  function queryDecimals(address payable token) internal returns (DataResult memory) {
    return callToken(token, encodeDecimals());
  }
  function executeQuery(TokenQueryPayload memory payload) internal returns (TokenQueryResult memory result) {
    result.name = queryName(payload.token);
    result.symbol = querySymbol(payload.token);
    result.decimals = queryDecimals(payload.token);
    result.balanceQueryResults = new DataResult[](payload.balanceQueries.length);
    for (uint256 i = 0; i < result.balanceQueryResults.length; i++) {
      result.balanceQueryResults[i] = queryBalance(payload.token, payload.balanceQueries[i]);
    }
    result.approvalQueryResults = new DataResult[](payload.approvalQueries.length);
    for (uint256 i = 0; i < result.approvalQueryResults.length; i++) {
      result.approvalQueryResults[i] = queryApproval(payload.approvalQueries[i], payload.token);
    }
  }
  function encodeResult(TokenQueryResult[] memory input) internal pure returns (bytes memory result) {
    result = abi.encode(input);
  }
  function encodeBalanceOf(address user) internal pure returns (bytes memory retval) {
    retval = abi.encodeWithSelector(IERC20.balanceOf.selector, user);
  }
  function queryBalance(address token, address user) internal returns (DataResult memory) {
    return callToken(token, encodeBalanceOf(user));
  }
  function encodeSymbol() internal pure returns (bytes memory retval) {
    retval = abi.encodePacked(ERC20Detailed.symbol.selector);
  }
  function querySymbol(address token) internal returns (DataResult memory) {
    return callToken(token, encodeSymbol());
  }
  function encodeName() internal pure returns (bytes memory retval) {
    retval = abi.encodePacked(ERC20Detailed.symbol.selector);
  }
  function queryName(address token) internal returns (DataResult memory) {
    return callToken(token, encodeName());
  }
  function encodeApproval(address source, address target) internal pure returns (bytes memory retval) {
    retval = abi.encodeWithSelector(MissingERC20.allowance.selector, source, target);
  }
  function queryApproval(ApprovalQueryPayload memory query, address token) internal returns (DataResult memory) {
    return callToken(token, encodeApproval(query.sourceAddress, query.targetAddress));
  }
}
