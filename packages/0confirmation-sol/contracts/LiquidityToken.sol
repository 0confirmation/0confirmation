pragma solidity ^0.6.2;

import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import { ERC20Detailed } from "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { TokenUtils } from "./utils/TokenUtils.sol";

contract LiquidityToken is ERC20Detailed, ERC20 {
  using TokenUtils for *;
  address public pool;
  address public asset;
  uint256 public offset;
  mapping (address => uint256) public outstandingLoans;
  constructor(address underlyingAsset, string memory name, string memory symbol) ERC20Detailed(name, symbol, ERC20Detailed(underlyingAsset).decimals()) public {
    pool = msg.sender;
    asset = underlyingAsset;
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
    uint256 totalLiquidity = super.totalSupply();
    uint256 reserve = getReserve();
    uint256 totalMinted = value * totalLiquidity / reserve;
    require(asset.transferTokenFrom(msg.sender, address(this), value), "transfer token failed");
    _mint(msg.sender, totalMinted);
    return totalMinted;
  }
  function removeLiquidity(uint256 value) public returns (uint256) {
    uint256 totalLiquidity = super.totalSupply();
    uint256 reserve = getReserve();
    uint256 totalBurned = value * reserve / totalLiquidity;
    _burn(msg.sender, totalBurned);
    require(asset.sendToken(msg.sender, totalBurned));
  }
}
