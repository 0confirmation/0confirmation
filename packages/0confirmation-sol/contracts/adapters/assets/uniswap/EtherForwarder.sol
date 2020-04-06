pragma solidity ^0.6.0;

contract EtherForwarder {
  event EtherForwardFailure();
  function forward(address payable target) public {
    (bool success, ) = target.call{ value: address(this).balance, gas: gasleft() }("");
    if (!success) emit EtherForwardFailure();
    selfdestruct(target);
  }
}
