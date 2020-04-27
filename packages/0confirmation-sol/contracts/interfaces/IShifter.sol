pragma solidity ^0.6.0;

interface IShifter {
  function mint(bytes32 _pHash, uint256 _amount, bytes32 _nHash, bytes calldata _sig) external returns (uint256);
  function shiftOut(bytes calldata _to, uint256 _amount) external returns (uint256);
  function shiftInFee() external view returns (uint256);
  function shiftOutFee() external view returns (uint256);
}
