pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { SandboxLib } from "../utils/sandbox/SandboxLib.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";

interface IInitializationActionsReceiver {
  function receiveInitializationActions(ShifterBorrowProxyLib.InitializationAction[] calldata actions) external returns (SandboxLib.Context memory context);
}
