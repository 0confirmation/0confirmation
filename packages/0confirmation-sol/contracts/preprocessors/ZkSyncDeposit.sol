// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { PreprocessorLib } from "./lib/PreprocessorLib.sol";
import { SandboxLib } from "../utils/sandbox/SandboxLib.sol";
import { BorrowProxyLib } from "../BorrowProxyLib.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";
import { IZkSync } from "../interfaces/IZkSync.sol";

contract ZkSyncDeposit {
  using PreprocessorLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  address public zkSync;
  address public recipient;
  function setup(bytes memory consData) public {
    (zkSync) = abi.decode(consData, (address));
  }
  function execute(bytes memory data) view public returns (ShifterBorrowProxyLib.InitializationAction[] memory result) {
    SandboxLib.ExecutionContext memory context = data.toContext();
    ZkSyncDeposit self = ZkSyncDeposit(context.preprocessorAddress);
    address token = isolate.token;
    address _zkSync = self.zkSync();
    uint256 balance = IERC20(isolate.token).balanceOf(address(this));
    return token.sendTransaction(abi.encodeWithSelector(IERC20.approve.selector, _zkSync, balance)).then(_zkSync.sendTransaction(abi.encodeWithSelector(IZkSync.depositERC20.selector, token, balance, isolate.owner)));
  }
}
