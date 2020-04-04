pragma solidity ^0.6.0;

contract EtherForwarder {
  function forward(address payable target) external {
    target.call.value(address(this).balance).gas(gasleft())("");
    selfdestruct(target);
  }
}
