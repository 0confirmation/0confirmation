pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { ModuleLib } from "../../lib/ModuleLib.sol";
import { BorrowProxyLib } from "../../../BorrowProxyLib.sol";
import { FactoryLib } from "../../../FactoryLib.sol";
import { IZkSync } from "../../../interfaces/IZkSync.sol";
import { ZkForwarder } from "./ZkForwarder.sol";
import { ZkSyncAdapterLib } from "./ZkSyncAdapterLib.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Create2 } from "@openzeppelin/contracts/utils/Create2.sol";

contract ZkSyncAdapter {
  using ModuleLib for *;
  using BorrowProxyLib for *;
  BorrowProxyLib.ProxyIsolate proxyIsolate;
  constructor() public {
    address zkForwarder = Create2.deploy(0, ZKFORWARDER_SALT, type(ZkForwarder).creationCode);
    assembly {
      sstore(ZKFORWARDER_SALT, zkForwarder)
    }
  }
  function getZkForwarderImplementation() public view returns (address zkForwarder) {
    assembly {
      zkForwarder := sload(ZKFORWARDER_SALT)
    }
  }
  bytes32 constant ZKFORWARDER_SALT = 0x4931c4066b9a1ca6cc19a44b7ff956dba5207afb3fc2c9ae3f62d46020a09209;
  function repay() public returns (bool) {
    ZkSyncAdapterLib.Isolate storage isolate = ZkSyncAdapterLib.getIsolatePointer();
    address zkForwarder = isolate.zkForwarder;
    if (zkForwarder != address(0x0)) {
      ZkForwarder(zkForwarder).forward();
    }
    return true;
  }
  function liquidate() public returns (bool) {
    ZkSyncAdapterLib.Isolate storage isolate = ZkSyncAdapterLib.getIsolatePointer();
    address zkForwarder = isolate.zkForwarder;
    if (zkForwarder != address(0x0)) {
      ZkForwarder(zkForwarder).liquidate();
    }
    return true;
  }
  function handle(ModuleLib.AssetSubmodulePayload memory payload) public payable {
    (bytes4 sig, bytes memory args) = payload.callData.splitPayload();
    if (sig == IZkSync.depositERC20.selector) {
      (, uint256 amount, address _franklinAddress) = abi.decode(args, (address, uint256, address));
      ZkSyncAdapterLib.Isolate storage isolate = ZkSyncAdapterLib.getIsolatePointer();
      address zkForwarder = FactoryLib.create2Clone(ZkSyncAdapter(payload.moduleAddress).getZkForwarderImplementation(), uint256(ZKFORWARDER_SALT));
      address token = proxyIsolate.token;
      isolate.zkForwarder = zkForwarder;
      IERC20(token).transfer(zkForwarder, amount);
      ZkForwarder(zkForwarder).initialize(payload.to, token, _franklinAddress);
    }
  }
}
