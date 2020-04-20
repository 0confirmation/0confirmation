pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { BorrowProxy } from "../../BorrowProxy.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { RevertCaptureLib } from "../../utils/RevertCaptureLib.sol";
import { IUniswapExchange } from "../../interfaces/IUniswapExchange.sol";

library DumpLib {
  struct DumpInputs {
    address payable exchangeAddress;
    address payable target;
  }
  function decodeDumpInputs(bytes memory args) internal pure returns (DumpInputs memory) {
    (address payable exchangeAddress, address payable target) = abi.decode(args, (address, address));
    return DumpInputs({
      exchangeAddress: exchangeAddress,
      target: target
    });
  }
  function dumpImpl(address payable exchangeAddress, address payable target) internal returns (bool) {
    (bool success, bytes memory retval) = address(this).delegatecall(abi.encodeWithSelector(BorrowProxy.proxy.selector, exchangeAddress, 0, abi.encodeWithSelector(IUniswapExchange.tokenToTokenSwapInput.selector, IERC20(IUniswapExchange(exchangeAddress).tokenAddress()).balanceOf(address(this)), 1, 1, block.number + 1, target)));
    if (!success) revert(RevertCaptureLib.decodeError(retval));
    return success;
  }
}
