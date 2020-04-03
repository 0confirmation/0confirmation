pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxyLib } from "../../BorrowProxyLib.sol";
import { BorrowProxyIsolateReaderViewLib } from "./BorrowProxyIsolateReaderViewLib.sol";

contract BorrowProxyIsolateReaderView {
  using BorrowProxyIsolateReaderViewLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  function render() view public returns (bytes memory) {
    bytes memory retval = abi.encode(isolate.toReadable());
    assembly {
      return(add(retval, 0x20), mload(retval))
    }
  }
}
