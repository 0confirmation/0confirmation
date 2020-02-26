pragma solidity ^0.6.2;

import { ShifterPoolLib } from "./ShifterPoolLib.sol"

contract Exports {
  event ProxyRecordExport(ShifterPoolLib.ProxyRecord record);
  event TriggerParcelExport(ShifterPoolLib.TriggerParcel record);
}
