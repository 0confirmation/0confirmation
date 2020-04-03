pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { PortfolioReaderViewLib } from "./PortfolioReaderViewLib.sol";
import { TokenQueryLib } from "../token/TokenQueryLib.sol";

contract PortfolioReaderView {
  using PortfolioReaderViewLib for *;
  function render(address moduleAddress, TokenQueryLib.TokenQueryPayload memory query) public returns (PortfolioReaderViewLib.PortfolioEntry[] memory) {
    return moduleAddress.executePortfolioReaderViewLogic(query);
  }
}
