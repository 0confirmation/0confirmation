pragma solidity ^0.6.0;

contract ICurve {
  uint256 constant N_COINS = 4;
  function add_liquidity(uint256[N_COINS] amounts, uint256 min_mint_amount) external;
  function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy) external;
  function exchange_underlying(int128 i, int128 j, uint256 dx, uint256 min_dy) external;
  function remove_liquidity(uint256 _amount, uint256[N_COINS] min_amounts) external;
  function remove_liquidity_imbalance(uint256[N_COINS] amounts, uint256 max_burn_amount) external;
  function coins(uint256 i) external returns (address payable);
  function underlying_coins(uint256 i) external returns (address payable);
}
