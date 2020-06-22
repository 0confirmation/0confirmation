pragma experimental ABIEncoderV2;
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";

contract LiquidityToken is ERC20, ERC20Burnable {
  using TokenUtils for *;
  address public pool;
  address public asset;
  uint256 public offset;
  mapping (address => uint256) public outstandingLoans;
  constructor(address shifterPool, address underlyingAsset, string memory name, string memory symbol, uint8 decimals) ERC20(name, symbol) public {
    pool = shifterPool;
    asset = underlyingAsset;
    _setupDecimals(decimals);
  }
  modifier onlyPool {
    require(msg.sender == pool, "must be called by pool manager");
    _;
  }
  function loan(address proxy, uint256 amount) public onlyPool returns (bool) {
    require(asset.sendToken(proxy, amount), "loan transfer failed");
    offset += amount;
    outstandingLoans[proxy] = amount;
    return true;
  }
  function resolveLoan(address proxy) public onlyPool returns (bool) {
    offset -= outstandingLoans[proxy];
    outstandingLoans[proxy] = 0;
    return true;
  }
  function getReserve() internal view returns (uint256) {
    return offset + IERC20(asset).balanceOf(address(this));
  }
  function addLiquidity(uint256 value) public returns (uint256) {
    uint256 totalLiquidity = totalSupply();
    uint256 reserve = getReserve();
    uint256 totalMinted = value * (totalLiquidity == 0 ? 1 : totalLiquidity) / (reserve + 1);
    require(asset.transferTokenFrom(msg.sender, address(this), value), "transfer token failed");
    _mint(msg.sender, totalMinted);
    return totalMinted;
  }
  function removeLiquidity(uint256 value) public returns (uint256) {
    uint256 totalLiquidity = totalSupply();
    uint256 reserve = getReserve();
    uint256 totalReturned = value * (reserve + 1) / (totalLiquidity == 0 ? 1 : totalLiquidity);
    _burn(msg.sender, value);
    require(asset.sendToken(msg.sender, totalReturned), "failed to send back token");
  }
}
