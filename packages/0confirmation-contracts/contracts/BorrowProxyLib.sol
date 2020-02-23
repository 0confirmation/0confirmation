pragma solidity ^0.6.2;

import { BorrowProxy } from "./BorrowProxy.sol";
import { IModuleRegistryProvider } from "./interfaces/IModuleRegistryProvider.sol";
import { AddressSetLib } from "./utils/AddressSetLib.sol";

library BorrowProxyLib {
  struct ProxyIsolate {
    address masterAddress;
    bool unbound;
    address owner;
    uint256 liquidationIndex;
    bool isLiquidating;
    AddressSetLib.AddressSet liquidationSet;
  }
  struct ControllerIsolate {
    mapping (address => bytes32) proxyInitializerRecord;
    mapping (address => address) ownerByProxy;
  }
  struct Module {
    address assetHandler;
    address liquidationModule;
  }
  struct ModuleExecution {
    address to;
    Module encapsulated;
  }
  function delegate(ModuleExecution memory module, ProxyIsolate storage isolate, bytes memory payload, uint256 value) internal {
    module.encapsulated.assetHandler.delegatecall(abi.encode(module.encapsulated.assetHandler, module.encapsulated.liquidationModule, tx.origin, module.to, value, payload));
    assert(false, "asset handler does not exist");
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
  function isDisbursing(ProxyIsolate storage isolate) internal pure returns (bool) {
    return isolate.signaturePublished && !isolate.unbound;
  }
  event BorrowProxyMade(address indexed user, address indexed proxyAddress, bytes record);
  function deployBorrowProxy(bytes32 salt) internal returns (address output) {
    bytes memory creationCode = type(BorrowProxy).creationCode;
    assembly {
      output := create2(0, add(creationCode, 0x20), mload(creationCode), salt)
    }
  }
  function deriveBorrowerAddress(bytes32 borrowerSalt) internal returns (address) {
    bytes memory spacer = new bytes(21);
    bytes memory deploymentCode = type(BorrowProxy).creationCode;
    uint256 deploymentCodeLength = deploymentCode.length;
    spacer[0] = bytes1(uint8(0xff));
    bytes memory preImage;
    assembly {
      mstore(deploymentCode, borrowerSalt)
      mstore(sub(deploymentCode, 0x20), address())
      mstore8(sub(deploymentCode, 0x21), 0xff)
      preImage := sub(deploymentCode, 0x35)
      mstore(preImage, add(deploymentCodeLength, 0x35))
    }
    return address(uint160(uint256(keccak256(preImage))));
  }

  function computeModuleKey(address to, bytes4 signature) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(to, signature));
  }
  function computeCodeResolverKey(address to, bytes4 signature) internal returns (bytes32) {
    bytes32 exthash;
    assembly {
      exthash := extcodehash(to)
    }
    return keccak256(abi.encodePacked(exthash, signature));
  }
  function resolveModule(ModuleRegistry storage registry, address to, bytes4 sig) internal view returns (Module memory) {
    BorrowProxyLib.Module memory module = registry.modules[computeCodeResolverKey(to, sig)];
    if (!module.isDefined()) module = registry.modules[computeModuleKey(to, sig)];
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
  function registerModuleByAddress(ModuleRegistry storage registry, address to, bytes4 signature, BorrowProxyLib.Module memory module) internal {
    registry.modules[computeModuleKey(to, signature)] = module;
  }
  function registerAddressByCodeHash(ModuleRegistry storage registry, bytes32 exthash, bytes4 signature, BorrowProxyLib.Module memory module) internal {
    registry.modules[computeCodeResolverKey(exthash, signature)] = module;
  }
  function fetchModule(ProxyIsolate storage isolate, address to, bytes4 signature) public returns (Module memory) {
    return IModuleRegistryProvider(isolate.masterAddress).fetchModuleHandler(to, signature);
  }
  function registerKeeper(BorrowProxyLib.ProxyIsolate storage isolate, address provider) internal {
    isolate.isProvider[provider] = true;
  }
  function unregisterKeeper(BorrowProxyLib.ProxyIsolate storage isolate, address provider) internal {
    isolate.isProvider[provider] = false;
  }
}
