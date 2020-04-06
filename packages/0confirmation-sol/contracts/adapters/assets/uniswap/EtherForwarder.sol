pragma solidity ^0.6.0;

contract EtherForwarder {
  function forward(address payable target) public payable returns (bool) {
    selfdestruct(target);
    return true;
  }
}
