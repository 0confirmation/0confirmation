pragma solidity ^0.6.0;

interface ILiquidationModule {
  function notify(address moduleAddress, bytes calldata payload) external returns (bool);
  function liquidate(address moduleAddress) external returns (bool);
}
