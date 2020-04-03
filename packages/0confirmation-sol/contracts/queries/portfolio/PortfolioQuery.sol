pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenQueryLib } from "../token/TokenQueryLib.sol";
import { BorrowProxy } from "../../BorrowProxy.sol";
import { PortfolioReaderView } from "./PortfolioReaderView.sol";
import { PortfolioReaderViewLib } from "./PortfolioReaderViewLib.sol";

contract PortfolioQuery {
  event PortfolioQueryExport(PortfolioReaderViewLib.PortfolioEntry[] exported);
  constructor(address borrowProxy, address moduleAddress, TokenQueryLib.TokenQueryPayload memory query) public {
    address viewLayer = address(new PortfolioReaderView());
    bytes memory result = BorrowProxy(borrowProxy).query(viewLayer, abi.encodeWithSelector(PortfolioReaderView.render.selector, moduleAddress, query));
    assembly {
      return(add(result, 0x20), mload(result))
    }
  }
}
