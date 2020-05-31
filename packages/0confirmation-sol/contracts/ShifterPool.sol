// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
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
import { SafeViewExecutor } from "./utils/sandbox/SafeViewExecutor.sol";
import { FactoryLib } from "./FactoryLib.sol";
import { NullCloneConstructor } from "./NullCloneConstructor.sol";
import { AssetForwarderLib } from "./adapters/lib/AssetForwarderLib.sol";
import { AssetForwarder } from "./adapters/lib/AssetForwarder.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { StringLib } from "./utils/StringLib.sol";

contract ShifterPool is Ownable, SafeViewExecutor, NullCloneConstructor {
  using SandboxLib for *;
  using ShifterPoolLib for *;
  using TokenUtils for *;
  using StringLib for *;
  using ShifterBorrowProxyLib for *;
  using ShifterBorrowProxyFactoryLib for *;
  using BorrowProxyLib for *;
  ShifterPoolLib.Isolate isolate;
  constructor() Ownable() public {
    isolate.genesis = block.number;
  }
  function setup(ShifterPoolLib.SetupParams memory params, BorrowProxyLib.ModuleDetails[] memory moduleDetails, BorrowProxyLib.Module[] memory modules, ShifterPoolLib.LiquidityTokenLaunch[] memory tokenLaunches) public onlyOwner {
    require(modules.length == moduleDetails.length, "can't zip module registations: modules.length != moduleDetails.length");
    isolate.shifterRegistry = params.shifterRegistry;
    isolate.maxLoan = params.maxLoan;
    isolate.minTimeout = params.minTimeout;
    isolate.poolFee = params.poolFee;
    isolate.daoFee = params.daoFee;
    for (uint256 i = 0; i < modules.length; i++) {
      BorrowProxyLib.ModuleRegistration memory registration = BorrowProxyLib.ModuleRegistration({
        module: modules[i],
        target: moduleDetails[i].target,
        sigs: moduleDetails[i].sigs,
        moduleType: moduleDetails[i].moduleType
      });
      isolate.registry.registryRegisterModule(registration);
    }
    for (uint256 i = 0; i < tokenLaunches.length; i++) {
      ShifterPoolLib.LiquidityTokenLaunch memory launch = tokenLaunches[i];
      isolate.tokenToLiquidityToken[launch.token] = launch.liqToken;
    }
  }
  function getLiquidityTokenForTokenHandler(address token) public view returns (address) {
    return isolate.tokenToLiquidityToken[token];
  }
  bytes32 constant BORROW_PROXY_IMPLEMENTATION_SALT = 0xfe1e3164ba4910db3c9afd049cd8feb4552390569c846692e6df4ac68aeaa90e;
  function deployBorrowProxyImplementation() public {
    isolate.borrowProxyImplementation = isolate.makeBorrowProxy(BORROW_PROXY_IMPLEMENTATION_SALT);
  }
  function deployAssetForwarderImplementation() public {
    isolate.assetForwarderImplementation = AssetForwarderLib.deployAssetForwarder();
  }

  function deployAssetForwarderClone(bytes32 salt) public returns (address created) {

    created = FactoryLib.create2Clone(isolate.assetForwarderImplementation, uint256(keccak256(abi.encodePacked(AssetForwarderLib.GET_ASSET_FORWARDER_IMPLEMENTATION_SALT(), msg.sender, salt))));

  }
  function getAssetForwarderImplementationHandler() public view returns (address implementation) {
    return isolate.assetForwarderImplementation;
  }
  function deployBorrowProxyClone(bytes32 salt) internal returns (address payable created) {
    created = address(uint160(FactoryLib.create2Clone(isolate.borrowProxyImplementation, uint256(salt))));
  }
  function validateUnderMaxLoan(ShifterBorrowProxyLib.LiquidityRequestParcel memory parcel) internal view returns (bool) {
    uint8 decimals = ERC20(parcel.request.token).decimals();
    require(decimals <= 18, "the token supplied is not a shifter token -- decimals too high");
    require(parcel.request.amount / 10**(18 - uint256(decimals)) <= isolate.maxLoan, "loan exceeds maximum");
  }
  function _executeBorrow(ShifterBorrowProxyLib.LiquidityRequestParcel memory liquidityRequestParcel, uint256 bond, uint256 timeoutExpiry) internal returns (address payable proxyAddress) {
    require(liquidityRequestParcel.request.forbidLoan == false, "is not a loan request, try using executeShiftSansBorrow");
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
    bytes32 borrowerSalt = liquidityRequest.computeBorrowerSalt();
    liquidityRequest.actions = new ShifterBorrowProxyLib.InitializationAction[](0);
    ShifterBorrowProxyLib.ProxyRecord memory proxyRecord = ShifterBorrowProxyLib.ProxyRecord({
      request: liquidityRequest,
      loan: ShifterBorrowProxyLib.LenderRecord(
        msg.sender,
        isolate.computeLoanParams(liquidityRequest.amount, bond, timeoutExpiry)
      )
    });
    proxyAddress = address(uint160(deployBorrowProxyClone(borrowerSalt)));
    ShifterPoolLib.mapBorrowProxy(isolate, proxyAddress, proxyRecord);
    isolate.issueLoan(liquidityRequest.token, proxyAddress, proxyRecord.computePostFee());
    require(liquidityRequest.token.transferTokenFrom(msg.sender, address(this), bond), "bond submission failed");
  }
  function executeBorrow(ShifterBorrowProxyLib.LiquidityRequestParcel memory liquidityRequestParcel, uint256 bond, uint256 timeoutExpiry) public payable {
    ShifterBorrowProxyLib.InitializationAction[] memory actions = liquidityRequestParcel.request.actions;
    validateUnderMaxLoan(liquidityRequestParcel);
    address payable proxyAddress = _executeBorrow(liquidityRequestParcel, bond, timeoutExpiry);
    proxyAddress.setupBorrowProxy(liquidityRequestParcel.request.borrower, liquidityRequestParcel.request.token, false);
    proxyAddress.sendInitializationActions(actions);
  }
  function executeShiftSansBorrow(ShifterBorrowProxyLib.SansBorrowShiftParcel memory parcel) public payable {
    (address payable proxyAddress, ShifterBorrowProxyLib.InitializationAction[] memory actions) = _executeShiftSansBorrow(parcel);
    if (actions.length != 0) proxyAddress.sendInitializationActions(actions);
  }
  function _executeShiftSansBorrow(ShifterBorrowProxyLib.SansBorrowShiftParcel memory parcel) internal returns (address payable proxyAddress, ShifterBorrowProxyLib.InitializationAction[] memory actions) {
    ShifterBorrowProxyLib.TriggerParcel memory triggerParcel = ShifterBorrowProxyLib.TriggerParcel({
      record: ShifterBorrowProxyLib.ProxyRecord({
        request: parcel.liquidityRequestParcel.request,
        loan: ShifterBorrowProxyLib.LenderRecord({
          keeper: msg.sender,
          params: isolate.computeLoanParams(parcel.liquidityRequestParcel.request.amount, parcel.liquidityRequestParcel.request.amount / 10, 1000)
        })
      }),
      shiftParameters: ShifterBorrowProxyLib.ShiftParameters({
        txhash: parcel.shiftParameters.txhash,
        vout: parcel.shiftParameters.vout,
        pHash: parcel.shiftParameters.pHash,
        darknodeSignature: parcel.shiftParameters.darknodeSignature
      })
    });
    require(
      parcel.liquidityRequestParcel.validateSignature(
        parcel.liquidityRequestParcel.computeLiquidityRequestHash()
      ),
      "liquidity request signature rejected"
    );
    bytes32 borrowerSalt = parcel.liquidityRequestParcel.request.computeBorrowerSalt();
    proxyAddress = address(uint160(isolate.borrowProxyImplementation.deriveBorrowerAddress(borrowerSalt)));
    require(!isolate.borrowProxyController.isInitialized(proxyAddress), "proxy has already been initialized");
    isolate.borrowProxyController.mapProxyRecord(proxyAddress, abi.encodePacked(uint256(1)));
    isolate.getShifter(parcel.liquidityRequestParcel.request.token).mint(parcel.shiftParameters.pHash, parcel.liquidityRequestParcel.request.amount, triggerParcel.computeNHash(), parcel.shiftParameters.darknodeSignature);
    uint256 fee = triggerParcel.record.computeAdjustedKeeperFee(parcel.liquidityRequestParcel.request.amount);
    deployBorrowProxyClone(borrowerSalt);
    proxyAddress.setupBorrowProxy(parcel.liquidityRequestParcel.request.borrower, parcel.liquidityRequestParcel.request.token, true);
    if (parcel.liquidityRequestParcel.request.borrower != msg.sender && msg.value == parcel.liquidityRequestParcel.gasRequested) {
      parcel.liquidityRequestParcel.request.borrower.transfer(msg.value);
      require(parcel.liquidityRequestParcel.request.token.sendToken(msg.sender, fee), "keeper payout failed");
      actions = parcel.liquidityRequestParcel.request.actions;
    } else if (parcel.liquidityRequestParcel.request.borrower == msg.sender) actions = parcel.actions;
    else revert("incorrect gas supplied with gas requested");
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
  function relayResolveLoan(address token, address liquidityToken, address keeper, uint256 bond, uint256 repay, uint256 originalAmount) public returns (bool) {
    require(isolate.borrowProxyController.proxyInitializerRecord[msg.sender] != bytes32(0x0), "not a registered borrow proxy");
    if (repay < originalAmount) {
      if (repay + bond < originalAmount) {
        if (true) revert(abi.encodePacked(repay.toString(), " ", bond.toString(), " ", originalAmount.toString()).toString());
        repay = repay + bond;
        bond = 0;
      } else {
        bond -= originalAmount - repay;
        repay = originalAmount;
      }
    }
    if (bond != 0) require(token.sendToken(keeper, bond), "failed to return bond to keeper");
    if (repay != 0) {
       (uint256 amount, uint256 daoAmount) = ShifterPoolLib.splitForDAO(repay, isolate.daoFee);
       require(token.sendToken(liquidityToken, amount), "failed to repay lost funds");
       require(token.sendToken(owner(), daoAmount), "failed to repay the governing DAO");
    }
    require(LiquidityToken(liquidityToken).resolveLoan(msg.sender), "loan resolution failure");
    return true;
  }
}
