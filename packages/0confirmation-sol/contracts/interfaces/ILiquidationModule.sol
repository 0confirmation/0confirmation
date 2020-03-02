pragma solidity ^0.6.2;

interface ILiquidationModule {
  function notify(address moduleAddress, bytes calldata payload) external returns (bool);
  function liquidate(address moduleAddress) external returns (bool);
}
