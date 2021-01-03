pragma solidity ^0.6.0;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IZkSync } from "../../../interfaces/IZkSync.sol";

contract ZkForwarder is Ownable {
  address public zkSync;
  address public token;
  address public franklinAddress;
  bool public isImplementation;
  constructor() Ownable() public {
    isImplementation = true;
  }
  modifier notImplementation {
    require(!isImplementation, "cannot be called on the implementation contract");
    _;
  }
  function initialize(address _zkSync, address _token, address _franklinAddress) public {
    require(zkSync == address(0x0), "already initialized");
    zkSync = _zkSync;
    token = _token;
    franklinAddress = _franklinAddress;
  }
  function forward() public {
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(IERC20(token).approve(zkSync, balance), "failed to approve funds");
    IZkSync(zkSync).depositERC20(token, uint256(balance), franklinAddress);
  }
  function liquidate() public {
    require(IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this))), "failed to transfer funds");
    selfdestruct(msg.sender);
  }
}
