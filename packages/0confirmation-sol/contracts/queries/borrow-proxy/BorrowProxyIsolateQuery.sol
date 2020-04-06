pragma solidity ^0.6.0;

import { BorrowProxy } from "../../BorrowProxy.sol";
import { BorrowProxyIsolateReaderView } from "./BorrowProxyIsolateReaderView.sol";
import { QueryLib } from "../lib/QueryLib.sol";

contract BorrowProxyIsolateQuery {
  using QueryLib for *;
  constructor(address payable borrowProxy) public {
    address viewLayer = address(new BorrowProxyIsolateReaderView());
    bytes memory result = BorrowProxy(borrowProxy).query(viewLayer, abi.encodeWithSelector(BorrowProxyIsolateReaderView.render.selector));
    result.returnBytes();
  }
}
