// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { BitcoinScriptLib } from "./BitcoinScriptLib.sol";
import { Base58Lib } from "./Base58Lib.sol";
import { ShifterPool } from "../ShifterPool.sol";
import { ShifterBorrowProxyLib } from "../ShifterBorrowProxyLib.sol";

library DepositAddressCalculatorLib {
  using BitcoinScriptLib for *;
  using ShifterBorrowProxyLib for *;
  using Base58Lib for *;
  bytes32 constant CONST_PHASH = 0x95ed33cacfb4bd126a51fa675a03b306beb369f81d951b7a40616cc1ac09e2cf;
  function computeGHash(address to, address tokenAddress, bytes32 pHash, bytes32 nonce) internal pure returns (bytes32 result) {
    result = keccak256(abi.encode(pHash, tokenAddress, to, nonce));
  }
  function _computeProxyAddress(address shifterPool, bytes32 salt) internal view returns (address proxyAddress) {
    proxyAddress = ShifterPool(shifterPool).computeProxyAddress(salt);
  }
  function computeDepositAddress(ShifterBorrowProxyLib.LiquidityRequest memory request, address shifterPool, address mpkh, bool isTestnet) internal view returns (string memory) {
    bytes32 gHash = computeGHash(_computeProxyAddress(shifterPool, request.computeBorrowerSalt()), request.token, CONST_PHASH, request.nonce);
    return BitcoinScriptLib.assembleMintScript(gHash, mpkh)
      .toAddress(isTestnet)
      .toBase58();
  }
}
