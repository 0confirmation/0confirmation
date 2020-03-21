pragma solidity ^0.6.3;
pragma experimental ABIEncoderV2;

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
  function queryDecimals(address payable token) internal returns (DataResult memory) {
    return callToken(token, abi.encodeWithSignature("decimals()"));
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
  function queryBalance(address token, address user) internal returns (DataResult memory) {
    return callToken(token, abi.encodeWithSignature("balanceOf(address)", user));
  }
  function querySymbol(address token) internal returns (DataResult memory) {
    return callToken(token, abi.encodeWithSignature("symbol()"));
  }
  function queryName(address token) internal returns (DataResult memory) {
    return callToken(token, abi.encodeWithSignature("name()"));
  }
  function queryApproval(ApprovalQueryPayload memory query, address token) internal returns (DataResult memory) {
    return callToken(token, abi.encodeWithSignature("approved(address,address)", query.sourceAddress, query.targetAddress));
  }
}
