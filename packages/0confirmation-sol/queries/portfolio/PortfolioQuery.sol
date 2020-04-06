pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenQueryLib } from "../token/TokenQueryLib.sol";
import { BorrowProxy } from "../../BorrowProxy.sol";
import { PortfolioReaderView } from "./PortfolioReaderView.sol";
import { PortfolioReaderViewLib } from "./PortfolioReaderViewLib.sol";
import { QueryLib } from "../lib/QueryLib.sol";

contract PortfolioQuery {
  using QueryLib for *;
  event PortfolioQueryExport(PortfolioReaderViewLib.PortfolioEntry[] exported);
  constructor(address payable borrowProxy, address moduleAddress, TokenQueryLib.TokenQueryPayload memory query) public {
    address viewLayer = address(new PortfolioReaderView());
    bytes memory result = BorrowProxy(borrowProxy).query(viewLayer, abi.encodeWithSelector(PortfolioReaderView.render.selector, moduleAddress, query));
    result.returnBytes();
  }
}
