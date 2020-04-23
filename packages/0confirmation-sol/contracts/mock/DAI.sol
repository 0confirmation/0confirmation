pragma solidity ^0.6.0;

import { ERC20Detailed } from "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract DAI is ERC20, ERC20Detailed {
  constructor() ERC20Detailed("DAI", "DAI", 18) public {}
  function mint(address user, uint256 amount) public {
    _mint(user, amount);
  }
}
