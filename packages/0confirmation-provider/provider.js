'use strict';

const { Web3Provider } = require('ethers/provider/web3-provider');
const Socket = require('@0confirmation/p2p');

class ConfirmationProvider {
  constructor({
    ethereum
  }) {
    this.ethereum = new Web3Provider(ethereum);
    this.socket = new Socket();
  }
  async start() {
    await this.socket.start();
  }
  
