pragma solidity ^0.6.0;

import { BorrowProxyLib } from "../../BorrowProxyLib.sol";

library BorrowProxyIsolateReaderViewLib {
  struct ReadableIsolate {
    address masterAddress;
    bool unbound;
    address owner;
    uint256 liquidationIndex;
    bool isLiquidating;
    address[] liquidationSet;
  }
  function toReadable(BorrowProxyLib.ProxyIsolate storage isolate) internal view returns (ReadableIsolate memory) {
    return ReadableIsolate({
      masterAddress: isolate.masterAddress,
      unbound: isolate.unbound,
      owner: isolate.owner,
      liquidationIndex: isolate.liquidationIndex,
      isLiquidating: isolate.isLiquidating,
      liquidationSet: isolate.liquidationSet.set
    });
  }
}
