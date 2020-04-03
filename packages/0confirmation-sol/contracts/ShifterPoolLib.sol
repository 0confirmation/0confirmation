pragma solidity ^0.6.2;

import { ECDSA } from "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { IShifterRegistry } from "./interfaces/IShifterRegistry.sol";
import { LiquidityToken } from "./LiquidityToken.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";

library ShifterPoolLib {
  using BorrowProxyLib for *;
  using SafeMath for *;
  struct Isolate {
    address shifterRegistry;
    uint256 poolFee;
    mapping (address => bool) isKeeper;
    mapping (bytes32 => bool) provisionExecuted;
    mapping (address => address) tokenToLiquidityToken;
    BorrowProxyLib.ControllerIsolate borrowProxyController;
    BorrowProxyLib.ModuleRegistry registry;
  }
  function computeLoanParams(Isolate storage isolate, uint256 amount, uint256 bond, uint256 timeoutExpiry) internal view returns (ShifterBorrowProxyLib.LenderParams memory) {
    require(timeoutExpiry >= 1e5, "timeout insufficient");
    uint256 baseKeeperFee = uint256(1 ether).div(100); // 1%
    require(bond.mul(uint256(1 ether)).div(amount) > uint256(1 ether).div(100), "bond below minimum");
    uint256 keeperFee = amount < bond ? baseKeeperFee : uint256(baseKeeperFee).mul(bond).div(amount);
    return ShifterBorrowProxyLib.LenderParams({
      keeperFee: keeperFee,
      poolFee: isolate.poolFee,
      timeoutExpiry: block.number + timeoutExpiry,
      bond: bond
    });
  }
  struct LiquidityProvisionMessage {
    uint256 amount;
    uint256 nonce;
    uint256 keeperFee;
    uint256 timeoutExpiry;
    bytes signature;
  }
  struct LiquidityTokenLaunch {
    address token;
    address liqToken;
  }
  function launchLiquidityToken(Isolate storage isolate, address token, string memory name, string memory symbol) internal returns (address) {
    require(isolate.tokenToLiquidityToken[token] == address(0x0), "already deployed liquidity token for target token");
    address liquidityToken = address(new LiquidityToken(address(this), token, name, symbol));
    isolate.tokenToLiquidityToken[token] = liquidityToken;
    return liquidityToken;
  }
  function getLiquidityToken(Isolate storage isolate, address token) internal view returns (address) {
    address retval = isolate.tokenToLiquidityToken[token];
    require(retval != address(0x0), "not a registered liquidity token");
    return retval;
  }
  function deriveProvisionHash(LiquidityProvisionMessage memory provision, bytes32 salt) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(provision.amount, provision.timeoutExpiry, provision.nonce, salt));
  }
  function recoverAddressFromHash(bytes32 provisionHash, bytes memory signature) internal pure returns (address) {
    return ECDSA.recover(provisionHash, signature);
  }
  function recoverAddress(LiquidityProvisionMessage memory provision, bytes32 salt) internal pure returns (address) {
    bytes32 provisionHash = deriveProvisionHash(provision, salt);
    return recoverAddressFromHash(provisionHash, provision.signature);
  }
  function lendLiquidity(Isolate storage isolate, address provider, address token, address target, uint256 amount) internal returns (bool) {
    if (!isolate.isKeeper[provider]) return false;
    (bool success,) = token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", provider, target, amount));
    return success;
  }
  function getShifter(Isolate storage isolate, address token) internal view returns (IShifter) {
    return IShifterRegistry(isolate.shifterRegistry).getShifterByToken(token);
  }
  function provisionHashAlreadyUsed(Isolate storage isolate, bytes32 provisionHash) internal view returns (bool) {
    return isolate.provisionExecuted[provisionHash];
  }
  function preventProvisionReplay(Isolate storage isolate, bytes32 provisionHash) internal returns (bool) {
    isolate.provisionExecuted[provisionHash] = true;
    return true;
  }
}
