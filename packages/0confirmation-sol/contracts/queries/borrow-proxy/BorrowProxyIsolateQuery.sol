pragma solidity ^0.6.0;

import { BorrowProxy } from "../../BorrowProxy.sol";
import { BorrowProxyIsolateReaderView } from "./BorrowProxyIsolateReaderView.sol";

contract BorrowProxyIsolateQuery {
  constructor(address borrowProxy) public {
    address viewLayer = address(new BorrowProxyIsolateReaderView());
    bytes memory result = BorrowProxy(borrowProxy).query(viewLayer, abi.encodeWithSelector(BorrowProxyIsolateReaderView.render.selector));
    assembly {
      return(add(result, 0x20), mload(result))
    }
  }
}
