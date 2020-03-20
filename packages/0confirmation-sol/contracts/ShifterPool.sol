pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/access/Ownable.sol";
import { IShifterRegistry } from "./interfaces/IShifterRegistry.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { ShifterPoolLib } from "./ShifterPoolLib.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { BorrowProxyFactoryLib } from "./BorrowProxyFactoryLib.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";
import { ViewExecutor } from "./utils/ViewExecutor.sol";
import { LiquidityToken } from "./LiquidityToken.sol";

contract ShifterPool is Ownable, ViewExecutor {
  using ShifterPoolLib for *;
  using TokenUtils for *;
  using ShifterBorrowProxyLib for *;
  using BorrowProxyLib for *;
  using BorrowProxyFactoryLib for *;
  ShifterPoolLib.Isolate isolate;
  function setup(address shifterRegistry, uint256 poolFee, BorrowProxyLib.ModuleRegistration[] memory modules, ShifterPoolLib.LiquidityTokenLaunch[] memory tokenLaunches) public onlyOwner {
    require(isolate.shifterRegistry == address(0x0), "already initialized");
    isolate.shifterRegistry = shifterRegistry;
    isolate.poolFee = poolFee;
    for (uint256 i = 0; i < modules.length; i++) {
      BorrowProxyLib.ModuleRegistration memory registration = modules[i];
      for (uint256 j = 0; j < registration.sigs.length; j++) {
        isolate.registry.registryRegisterModule(registration);
      }
    }
    for (uint256 i = 0; i < tokenLaunches.length; i++) {
      ShifterPoolLib.LiquidityTokenLaunch memory launch = tokenLaunches[i];
      isolate.tokenToLiquidityToken[launch.token] = launch.liqToken;
    }
  }
  function executeBorrow(ShifterBorrowProxyLib.LiquidityRequestParcel memory liquidityRequestParcel, uint256 bond, uint256 timeoutExpiry) public payable {
    require(liquidityRequestParcel.gasRequested == msg.value, "supplied ether is not equal to gas requested");
    bytes32 requestHash = liquidityRequestParcel.computeLiquidityRequestHash();
    require(liquidityRequestParcel.validateSignature(requestHash), "liquidity request signature rejected");
    ShifterBorrowProxyLib.LiquidityRequest memory liquidityRequest = liquidityRequestParcel.request;
    bytes32 borrowerSalt = liquidityRequest.computeBorrowerSalt();
    address proxyAddress = borrowerSalt.deriveBorrowerAddress();
    require(!isolate.borrowProxyController.isInitialized(proxyAddress), "proxy has already been initialized");
    ShifterBorrowProxyLib.LenderRecord memory loan;
    loan.keeper = msg.sender;
    loan.params = isolate.computeLoanParams(liquidityRequest.amount, bond, timeoutExpiry);
    ShifterBorrowProxyLib.ProxyRecord memory proxyRecord = ShifterBorrowProxyLib.ProxyRecord({
      request: liquidityRequest,
      loan: loan
    });
    bytes memory data = abi.encode(proxyRecord);
    require(LiquidityToken(isolate.getLiquidityToken(liquidityRequest.token)).loan(proxyAddress, proxyRecord.computePostFee()), "insufficient funds in liquidity pool");
    isolate.borrowProxyController.mapProxyRecord(proxyAddress, data);
    isolate.borrowProxyController.setProxyOwner(proxyAddress, liquidityRequest.borrower);
    liquidityRequest.borrower.transfer(msg.value);
    require(liquidityRequest.token.transferTokenFrom(msg.sender, address(this), bond), "bond submission failed");
    require(borrowerSalt.deployBorrowProxy() == proxyAddress, "proxy deployment failed");
    emit BorrowProxyLib.BorrowProxyMade(liquidityRequest.borrower, proxyAddress, data);
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
  function relayResolveLoan(address token, address liquidityToken, address keeper, uint256 bond, uint256 repay) public returns (bool) {
    require(isolate.borrowProxyController.proxyInitializerRecord[msg.sender] != bytes32(0x0), "not a registered borrow proxy");
    if (bond != 0) require(token.sendToken(keeper, bond), "failed to return bond to keeper");
    if (repay != 0) require(token.sendToken(liquidityToken, repay), "failed to repay lost funds");
    require(LiquidityToken(liquidityToken).resolveLoan(msg.sender));
    return true;
  }
}
