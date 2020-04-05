pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";

contract Exports {
  event InitializationActionsExport(ShifterBorrowProxyLib.InitializationAction[] actions);
  event ProxyRecordExport(ShifterBorrowProxyLib.ProxyRecord record);
  event TriggerParcelExport(ShifterBorrowProxyLib.TriggerParcel record);
}
