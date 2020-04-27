pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Ownable } from "openzeppelin-solidity/contracts/access/Ownable.sol";
import { IShifterRegistry } from "./interfaces/IShifterRegistry.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { ShifterPoolLib } from "./ShifterPoolLib.sol";
import { ShifterBorrowProxyLib } from "./ShifterBorrowProxyLib.sol";
import { ShifterBorrowProxyFactoryLib } from "./ShifterBorrowProxyFactoryLib.sol";
import { ShifterBorrowProxy } from "./ShifterBorrowProxy.sol";
import { BorrowProxy } from "./BorrowProxy.sol";
import { BorrowProxyLib } from "./BorrowProxyLib.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";
import { ViewExecutor } from "./utils/ViewExecutor.sol";
import { LiquidityToken } from "./LiquidityToken.sol";
import { SandboxLib } from "./utils/sandbox/SandboxLib.sol";
import { Create2CloneFactory } from "./utils/Create2CloneFactory.sol";

contract ShifterPool is Ownable, ViewExecutor, Create2CloneFactory {
  using SandboxLib for *;
  using ShifterPoolLib for *;
  using TokenUtils for *;
  using ShifterBorrowProxyLib for *;
  using ShifterBorrowProxyFactoryLib for *;
  using BorrowProxyLib for *;
  ShifterPoolLib.Isolate isolate;
  function cloneConstructor(bytes calldata consData) external override {
    // do nothing
  }
  function setup(address shifterRegistry, uint256 minTimeout, uint256 poolFee, BorrowProxyLib.ModuleRegistration[] memory modules, ShifterPoolLib.LiquidityTokenLaunch[] memory tokenLaunches) public onlyOwner {
    require(isolate.shifterRegistry == address(0x0), "already initialized");
    isolate.shifterRegistry = shifterRegistry;
    isolate.minTimeout = minTimeout;
    isolate.poolFee = poolFee;
    for (uint256 i = 0; i < modules.length; i++) {
      BorrowProxyLib.ModuleRegistration memory registration = modules[i];
      isolate.registry.registryRegisterModule(registration);
    }
    for (uint256 i = 0; i < tokenLaunches.length; i++) {
      ShifterPoolLib.LiquidityTokenLaunch memory launch = tokenLaunches[i];
      isolate.tokenToLiquidityToken[launch.token] = launch.liqToken;
    }
  }
  bytes32 constant BORROW_PROXY_IMPLEMENTATION_SALT = 0xfe1e3164ba4910db3c9afd049cd8feb4552390569c846692e6df4ac68aeaa90e;
  function deployBorrowProxyImplementation() public {
    isolate.borrowProxyImplementation = isolate.makeBorrowProxy(BORROW_PROXY_IMPLEMENTATION_SALT);
  }
  function deployBorrowProxyClone(bytes32 salt) public returns (address payable created) {
    created = address(uint160(create2Clone(isolate.borrowProxyImplementation, uint256(salt))));
  }
  function _executeBorrow(ShifterBorrowProxyLib.LiquidityRequestParcel memory liquidityRequestParcel, uint256 bond, uint256 timeoutExpiry) internal returns (bytes32 borrowerSalt) {
    require(
      liquidityRequestParcel.gasRequested == msg.value,
      "supplied ether is not equal to gas requested"
    );
    require(
      liquidityRequestParcel.validateSignature(
        liquidityRequestParcel.computeLiquidityRequestHash()
      ),
      "liquidity request signature rejected"
    );
    ShifterBorrowProxyLib.LiquidityRequest memory liquidityRequest = liquidityRequestParcel.request;
    borrowerSalt = liquidityRequest.computeBorrowerSalt();
    address payable proxyAddress = address(uint160(isolate.borrowProxyImplementation.deriveBorrowerAddress(borrowerSalt)));
    require(!isolate.borrowProxyController.isInitialized(proxyAddress), "proxy has already been initialized");
    ShifterBorrowProxyLib.ProxyRecord memory proxyRecord = ShifterBorrowProxyLib.ProxyRecord({
      request: liquidityRequest,
      loan: ShifterBorrowProxyLib.LenderRecord(
        msg.sender,
        isolate.computeLoanParams(liquidityRequest.amount, bond, timeoutExpiry)
      )
    });
    ShifterPoolLib.mapBorrowProxy(isolate, proxyAddress, proxyRecord);
    isolate.issueLoan(liquidityRequest.token, proxyAddress, proxyRecord.computePostFee());
    require(liquidityRequest.token.transferTokenFrom(msg.sender, address(this), bond), "bond submission failed");
    return borrowerSalt;
  }
  function executeBorrow(ShifterBorrowProxyLib.LiquidityRequestParcel memory liquidityRequestParcel, uint256 bond, uint256 timeoutExpiry) public payable {
    bytes32 salt = _executeBorrow(liquidityRequestParcel, bond, timeoutExpiry);
    address payable proxyAddress = deployBorrowProxyClone(salt);
    proxyAddress.setupBorrowProxy(liquidityRequestParcel.request.borrower, liquidityRequestParcel.request.token);
    proxyAddress.sendInitializationActions(liquidityRequestParcel.request.actions);
  }
  function validateProxyRecordHandler(bytes memory proxyRecord) public view returns (bool) {
    return isolate.borrowProxyController.validateProxyRecord(msg.sender, proxyRecord);
  }
  function getProxyTokenHandler(address proxyAddress) public view returns (address) {
    return isolate.borrowProxyController.getProxyToken(proxyAddress);
  }
  function getProxyOwnerHandler(address user) public view returns (address) {
    return isolate.borrowProxyController.getProxyOwner(user);
  }
  function getShifterHandler(address token) public view returns (IShifter) {
    return isolate.getShifter(token);
  }
  function getLiquidityTokenHandler(address token) public view returns (LiquidityToken) {
    return LiquidityToken(isolate.getLiquidityToken(token));
  }
  function fetchModuleHandler(address to, bytes4 sig) public view returns (BorrowProxyLib.Module memory) {
    return isolate.registry.resolveModule(to, sig);
  }
  function relayResolveLoan(address token, address liquidityToken, address keeper, uint256 bond, uint256 repay) public returns (bool) {
    require(isolate.borrowProxyController.proxyInitializerRecord[msg.sender] != bytes32(0x0), "not a registered borrow proxy");
    if (bond != 0) require(token.sendToken(keeper, bond), "failed to return bond to keeper");
    if (repay != 0) require(token.sendToken(liquidityToken, repay), "failed to repay lost funds");
    require(LiquidityToken(liquidityToken).resolveLoan(msg.sender), "loan resolution failure");
    return true;
  }
}
