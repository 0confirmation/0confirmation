pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { ERC20AdapterLib } from "../../adapters/assets/erc20/ERC20AdapterLib.sol";

contract PendingTransfersQuery {
  function execute(bytes memory) public view returns (ERC20AdapterLib.EscrowRecord[] memory) {
    return ERC20AdapterLib.getIsolatePointer().payments;
  }
}
