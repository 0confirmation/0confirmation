pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { PreprocessorLib } from "./lib/PreprocessorLib.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";
import { SandboxLib } from "../utils/sandbox/SandboxLib.sol";
import { BorrowProxyLib } from "../BorrowProxyLib.sol";

contract TransferAll {
  using PreprocessorLib for *;
  BorrowProxyLib.ProxyIsolate isolate;
  address public token;
  address public target;
  constructor(address _token, address _target) public {
    token = _token;
    target = _target;
  }
  function execute(bytes memory data) view public returns (ShifterBorrowProxyLib.InitializationAction[] memory) {
    SandboxLib.ExecutionContext memory context = data.toContext();
    return TransferAll(context.preprocessorAddress).token().sendTransaction(abi.encodeWithSelector(IERC20.transfer.selector, TransferAll(context.preprocessorAddress).target(), IERC20(TransferAll(context.preprocessorAddress).token()).balanceOf(address(this))));
  }
}
