pragma solidity ^0.6.2;

contract ILiquidationModule {
  function notify(address moduleAddress, bytes memory payload) public returns (bool);
  function liquidate(address moduleAddress) public returns (bool);
}
