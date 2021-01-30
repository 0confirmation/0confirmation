// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IZkSync {
  function depositERC20(address _token, uint256 _amount, address _franklinAddr) external;
}
