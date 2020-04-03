pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { TokenQueryLib } from "../token/TokenQueryLib.sol";
import { SimpleBurnLiquidationModuleLib } from "../../adapters/liquidity/SimpleBurnLiquidationModuleLib.sol";

library PortfolioReaderViewLib {
  struct PortfolioEntry {
    address payable token;
    TokenQueryLib.TokenQueryResult data;
  }
  function executePortfolioReaderViewLogic(address moduleAddress, TokenQueryLib.TokenQueryPayload memory query) internal returns (PortfolioEntry[] memory) {
    SimpleBurnLiquidationModuleLib.Isolate storage isolate = SimpleBurnLiquidationModuleLib.getIsolatePointer(moduleAddress);
    address[] memory set = isolate.toLiquidate.set;
    PortfolioEntry[] memory result = new PortfolioEntry[](set.length + 1);
    result[0].token = query.token;
    result[0].data = TokenQueryLib.executeQuery(query);
    for (uint256 i = 0; i < set.length; i++) {
      result[i + 1].token = address(uint160(set[i]));
      query.token = address(uint160(set[i]));
      result[i + 1].data = TokenQueryLib.executeQuery(query);
    }
    return result;
  }
}
