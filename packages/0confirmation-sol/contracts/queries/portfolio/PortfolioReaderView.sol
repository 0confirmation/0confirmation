pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenQueryLib } from "../token/TokenQueryLib.sol";
import { PortfolioReaderViewLib } from "./PortfolioReaderViewLib.sol";

contract PortfolioReaderView {
  using PortfolioReaderViewLib for *;
  function render(TokenQueryLib.TokenQueryPayload memory query) public returns (PortfolioReaderViewLib.PortfolioEntry[] memory) {
    return query.executePortfolioReaderViewLogic();
  }
}
