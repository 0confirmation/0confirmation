pragma solidity ^0.6.3;

import { ShifterMock } from "./ShifterMock.sol";

contract ShifterRegistryMock {
  mapping (address => address) public getShifterByToken;
  address public token;
  address public shifter;
  constructor() public {
    shifter = address(new ShifterMock());
    token = ShifterMock(shifter).token();
    getShifterByToken[token] = shifter;
  }
}
