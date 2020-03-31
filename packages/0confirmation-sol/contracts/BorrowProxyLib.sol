pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import { Create2 } from "openzeppelin-solidity/contracts/utils/Create2.sol";
import { IModuleRegistryProvider } from "./interfaces/IModuleRegistryProvider.sol";
import { AddressSetLib } from "./utils/AddressSetLib.sol";

library BorrowProxyLib {
  struct ProxyIsolate {
    address masterAddress;
    bool unbound;
    address owner;
    uint256 liquidationIndex;
    bool isLiquidating;
    uint256 preBalance;
    AddressSetLib.AddressSet liquidationSet;
  }
  struct ControllerIsolate {
    mapping (address => bytes32) proxyInitializerRecord;
    mapping (address => address) ownerByProxy;
    mapping (address => bool) isKeeper;
  }
  struct Module {
    address assetHandler;
    address liquidationModule;
  }
  struct ModuleRegistration {
    ModuleRegistrationType moduleType;
    address target;
    bytes4[] sigs;
    Module module;
  }
  enum ModuleRegistrationType {
    UNINITIALIZED,
    BY_CODEHASH,
    BY_ADDRESS
  }
  struct ModuleExecution {
    address to;
    Module encapsulated;
  }
  function registryRegisterModule(ModuleRegistry storage registry, ModuleRegistration memory registration) internal {
    if (registration.moduleType == ModuleRegistrationType.BY_CODEHASH) for (uint256 i = 0; i < registration.sigs.length; i++) {
      registerModuleByCodeHash(registry, registration.target, registration.sigs[i], registration.module);
    } else if (registration.moduleType == ModuleRegistrationType.BY_ADDRESS) for (uint256 i = 0; i < registration.sigs.length; i++) {
      registerModuleByAddress(registry, registration.target, registration.sigs[i], registration.module);
    }
  }
  function delegateLiquidate(address liquidationModule) internal returns (bool) {
    (bool success, bytes memory retval) = liquidationModule.delegatecall(abi.encodeWithSignature("liquidate(address)", liquidationModule));
    if (retval.length != 0x20) return false;
    (bool decoded) = abi.decode(retval, (bool));
    return success && decoded;
  }
  function delegateNotify(address liquidationModule, bytes memory payload) internal returns (bool) {
    (bool success,) = liquidationModule.delegatecall(abi.encodeWithSignature("notify(address,bytes)", liquidationModule, payload));
    return success;
  }
  function delegate(ModuleExecution memory module, bytes memory payload, uint256 value) internal returns (bytes memory) {
    (bool success, bytes memory retval) = module.encapsulated.assetHandler.delegatecall(abi.encode(module.encapsulated.assetHandler, module.encapsulated.liquidationModule, tx.origin, module.to, value, payload));
    require(success, string(retval));
    return retval;
  }
  function isDefined(Module memory module) internal pure returns (bool) {
    return module.assetHandler != address(0x0);
  }
  function isInitialized(ControllerIsolate storage isolate, address proxyAddress) internal view returns (bool) {
    return isolate.proxyInitializerRecord[proxyAddress] != bytes32(uint256(0x0));
  }
  struct ModuleRegistry {
    mapping (bytes32 => Module) modules;
  }
  function isDisbursing(ProxyIsolate storage isolate) internal view returns (bool) {
    return isolate.isLiquidating && isolate.liquidationIndex != isolate.liquidationSet.set.length;
  }
  event BorrowProxyMade(address indexed user, address indexed proxyAddress, bytes record);
  function computeModuleKey(address to, bytes4 signature) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(to, signature));
  }
  function computeCodeResolverKey(address to, bytes4 signature) internal view returns (bytes32) {
    bytes32 exthash;
    assembly {
      exthash := extcodehash(to)
    }
    return keccak256(abi.encodePacked(exthash, signature));
  }
  function resolveModule(ModuleRegistry storage registry, address to, bytes4 sig) internal view returns (Module memory) {
    Module memory module = registry.modules[computeCodeResolverKey(to, sig)];
    if (!isDefined(module)) module = registry.modules[computeModuleKey(to, sig)];
    return module;
  }

  function getModuleExecution(ModuleRegistry storage registry, address to, bytes4 signature) internal view returns (ModuleExecution memory) {
    Module memory encapsulated = resolveModule(registry, to, signature);
    return ModuleExecution({
      encapsulated: encapsulated,
      to: to
    });
  }
  function validateProxyRecord(ControllerIsolate storage isolate, address proxyAddress, bytes memory data) internal view returns (bool) {
    return isolate.proxyInitializerRecord[proxyAddress] == keccak256(data);
  }
  function mapProxyRecord(ControllerIsolate storage isolate, address proxyAddress, bytes memory data) internal {
    isolate.proxyInitializerRecord[proxyAddress] = keccak256(data);
  }
  function setProxyOwner(ControllerIsolate storage isolate, address proxyAddress, address identity) internal {
    isolate.ownerByProxy[proxyAddress] = identity;
  }
  function getProxyOwner(ControllerIsolate storage isolate, address proxyAddress) internal view returns (address) {
    return isolate.ownerByProxy[proxyAddress];
  }
  function registerModuleByAddress(ModuleRegistry storage registry, address to, bytes4 signature, Module memory module) internal {
    registry.modules[computeModuleKey(to, signature)] = module;
  }
  function registerModuleByCodeHash(ModuleRegistry storage registry, address to, bytes4 signature, Module memory module) internal {
    registry.modules[computeCodeResolverKey(to, signature)] = module;
  }
  function fetchModule(ProxyIsolate storage isolate, address to, bytes4 signature) public returns (ModuleExecution memory) {
    return ModuleExecution({
      encapsulated: IModuleRegistryProvider(isolate.masterAddress).fetchModuleHandler(to, signature),
      to: to
    });
  }
  function registerKeeper(ControllerIsolate storage isolate, address provider) internal {
    isolate.isKeeper[provider] = true;
  }
  function unregisterKeeper(ControllerIsolate storage isolate, address provider) internal {
    isolate.isKeeper[provider] = false;
  }
}
