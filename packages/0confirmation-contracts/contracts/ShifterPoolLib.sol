pragma solidity ^0.6.2;

import { ECDSA } from "github.com/OpenZeppelin/openzeppelin-contracts/contracts/cryptography/ECDSA.sol";
import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { RenVMShiftMessageLib } from "./RenVMShiftMessageLib.sol";
import { IShifter } from "github.com/renproject/darknode-sol/contracts/Shifter/IShifter.sol";

library ShifterPoolLib {
  using BorrowProxyLib for *;
  struct Isolate {
    address shifterRegistry;
    mapping (address => bool) isKeeper;
    mapping (bytes32 => bool) provisionExecuted;
    BorrowProxyLib.ControllerIsolate borrowProxyController;
    BorrowProxyLib.ModuleRegistry registry;
  }
  struct LiquidityProvisionMessage {
    uint256 amount;
    uint256 nonce;
    uint256 fee;
    bytes signature;
  }
  function deriveProvisionHash(ZCFLiquidityProvisionMessage memory provision, bytes32 salt) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(provision.amount, provision.nonce, salt));
  }
  function recoverAddressFromHash(bytes32 provisionHash, bytes memory signature) internal pure returns (address) {
    return ECDSA.recover(provisionHash, provision.signature);
  }
  function recoverAddress(LiquidityProvisionMessage memory provision, bytes32 salt) internal pure returns (bool) {
    bytes32 provisionHash = deriveProvisionHash(provision, salt);
    return recoverAddressFromHash(provisionHash, provision.signature);
  }
  function lendLiquidity(Isolate storage isolate, address provider, address token, address target, uint256 amount) internal returns (bool) {
    if (!isolate.isProvider[provider]) return false;
    (bool success,) = token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", provider, target, amount));
    return success;
  }
  function getShifter(Isolate storage isolate, address token) internal view returns (IShifter) {
    return IShifter(address(ShifterRegistry(isolate.shifterRegistry).getShifterByToken(token)));
  }
  function provisionHashAlreadyUsed(Isolate storage isolate, bytes32 provisionHash) internal view returns (bool) {
    return isolate.provisionExecuted[provisionHash];
  }
  function preventProvisionReplay(Isolate storage isolate, bytes32 provisionHash) internal returns (bool) {
    isolate.provisionExecuted[provisionHash] = true;
    return true;
  }
}
