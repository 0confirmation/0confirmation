pragma solidity ^0.6.2;

import { IShifterRegistry } from "./interfaces/IShifterRegistry.sol";
import { IShifter } from "./interfaces/IShifter.sol";
import { ShifterPoolLib } from "./ShifterPoolLib.sol";
import { BorrowProxy } from "./BorrowProxy.sol";

contract ShifterPool {
  using ShifterPoolLib for *;
  ShifterPoolLib.Isolate public isolate;
  constructor(address shifterRegistry) public {
    isolate.shifterRegistry = shifterRegistry;
  }
  function borrow(address token, ShifterPoolLib.RenVMShiftMessage memory shiftMessage, ShifterPoolLib.LiquidityProvisionMessage memory liquidityProvision) external {
    bytes32 borrowerSalt = shiftMessage.computeBorrowerSalt(token, msg.sender);
    address proxyAddress = shiftMessage.computeBorrowerAddress(borrowerSalt);
    require(!isolate.borrowProxyController.isInitialized(proxyAddress), "shift message already used");
    ShifterPoolLib.LenderRecord memory record;
    ShifterPoolLib.ProxyRecord memory proxyRecord = ShifterPoolLib.ProxyRecord({
      token: token,
      message: shiftMessage,
      record: record
    });
    bytes32 provisionHash = liquidityProvision.deriveProvisionHash(borrowerSalt);
    require(isolate.provisionHashAlreadyUsed(provisionHash), "liquidity provision message already used");
    address keeper = provisionHash.recoverAddressFromHash(liquidityProvision.signature);
    proxyRecord.loan = ShifterPoolLib.LenderRecord({
      keeper: keeper,
      amount: liquidityProvision.amount,
      keeperFee: liquidityProvision.fee,
      poolFee: isolate.poolFee
    });
    require(token.sendToken(proxyAddress, proxyRecord.loan.computePostFee()));
    isolate.preventProvisionReplay(provisionHash);
    bytes memory data = abi.encode(proxyRecord);
    isolate.borrowProxyController.mapProxyRecord(proxyAddress, data);
    isolate.borrowProxyController.setProxyOwner(proxyAddress, msg.sender);
    emit BorrowProxyLib.BorrowerProxyMade(msg.sender, proxyAddress, data);
    assert(BorrowProxyLib.deployBorrowProxy(borrowerSalt) == proxyAddress, "fatal: borrower address mismatch");
  }
  function validateProxyRecordHandler(bytes memory proxyRecord) public view returns (bool) {
    return isolate.borrowProxyController.validateProxyRecord(msg.sender, proxyRecord);
  }
  function getProxyOwnerHandler() public view returns (address) {
    return isolate.borrowProxyController.getProxyOwner(msg.sender);
  }
  function getShifterPoolHandler(address token) public view returns (IShifter) {
    return isolate.getShifter(token);
  }
}
