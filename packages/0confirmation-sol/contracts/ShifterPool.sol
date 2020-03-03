pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { IShifterRegistry } from "./interfaces/IShifterRegistry.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { ShifterPoolLib } from "./ShifterPoolLib.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { RenVMShiftMessageLib } from "./RenVMShiftMessageLib.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";
import { LiquidityToken } from "./LiquidityToken.sol";

contract ShifterPool {
  using ShifterPoolLib for *;
  using TokenUtils for *;
  using ShifterBorrowProxyLib for *;
  using BorrowProxyLib for *;
  using RenVMShiftMessageLib for *;
  ShifterPoolLib.Isolate isolate;
  function setup(address shifterRegistry, uint256 poolFee, BorrowProxyLib.ModuleRegistration[] memory modulesByCode, BorrowProxyLib.ModuleRegistration[] memory modulesByAddress, ShifterPoolLib.LiquidityTokenLaunch[] memory tokenLaunches) public {
    isolate.shifterRegistry = shifterRegistry;
    isolate.poolFee = poolFee;
    assembly {
      return(0x0, 0x0)
    }
    for (uint256 i = 0; i < modulesByCode.length; i++) {
      BorrowProxyLib.ModuleRegistration memory registration = modulesByCode[i];
      for (uint256 j = 0; j < registration.sigs.length; j++) {
        isolate.registry.registerModuleByCodeHash(registration.target, registration.sigs[i], registration.module);
      }
    }
    for (uint256 i = 0; i < modulesByAddress.length; i++) {
      BorrowProxyLib.ModuleRegistration memory registration = modulesByAddress[i];
      for (uint256 j = 0; j < registration.sigs.length; j++) {
        isolate.registry.registerModuleByCodeHash(registration.target, registration.sigs[i], registration.module);
      }
    }
    for (uint256 i = 0; i < tokenLaunches.length; i++) {
      ShifterPoolLib.LiquidityTokenLaunch memory launch = tokenLaunches[i];
      isolate.tokenToLiquidityToken[launch.token] = launch.liqToken;
    }
  }
  function borrow(address token, RenVMShiftMessageLib.RenVMShiftMessage memory shiftMessage, ShifterPoolLib.LiquidityProvisionMessage memory liquidityProvision) public {
    bytes32 borrowerSalt = shiftMessage.computeBorrowerSalt(token, msg.sender);
    address proxyAddress = borrowerSalt.deriveBorrowerAddress();
    require(!isolate.borrowProxyController.isInitialized(proxyAddress), "shift message already used");
    ShifterBorrowProxyLib.LenderRecord memory loan;
    ShifterBorrowProxyLib.ProxyRecord memory proxyRecord = ShifterBorrowProxyLib.ProxyRecord({
      token: token,
      timeoutExpiry: liquidityProvision.timeoutExpiry,
      message: shiftMessage,
      loan: loan
    });
    bytes32 provisionHash = liquidityProvision.deriveProvisionHash(borrowerSalt);
    require(isolate.provisionHashAlreadyUsed(provisionHash), "liquidity provision message already used");
    address keeper = provisionHash.recoverAddressFromHash(liquidityProvision.signature);
    proxyRecord.loan = ShifterBorrowProxyLib.LenderRecord({
      keeper: keeper,
      amount: liquidityProvision.amount,
      keeperFee: liquidityProvision.keeperFee,
      poolFee: isolate.poolFee
    });
    require(LiquidityToken(isolate.getLiquidityToken(token)).loan(proxyAddress, proxyRecord.loan.computePostFee()), "insufficient funds in liquidity pool");
    isolate.preventProvisionReplay(provisionHash);
    bytes memory data = abi.encode(proxyRecord);
    isolate.borrowProxyController.mapProxyRecord(proxyAddress, data);
    isolate.borrowProxyController.setProxyOwner(proxyAddress, msg.sender);
    emit BorrowProxyLib.BorrowProxyMade(msg.sender, proxyAddress, data);
  }
  function validateProxyRecordHandler(bytes memory proxyRecord) public view returns (bool) {
    return isolate.borrowProxyController.validateProxyRecord(msg.sender, proxyRecord);
  }
  function getProxyOwnerHandler() public view returns (address) {
    return isolate.borrowProxyController.getProxyOwner(msg.sender);
  }
  function getShifterHandler(address token) public view returns (IShifter) {
    return isolate.getShifter(token);
  }
  function getLiquidityTokenHandler(address token) public view returns (LiquidityToken) {
    return LiquidityToken(isolate.getLiquidityToken(token));
  }
  function relayResolveLoan(address liquidityToken) public returns (bool) {
    require(isolate.borrowProxyController.proxyInitializerRecord[msg.sender] != bytes32(0x0), "not a registered borrow proxy");
    require(LiquidityToken(liquidityToken).resolveLoan(msg.sender));
    return true;
  }
}
