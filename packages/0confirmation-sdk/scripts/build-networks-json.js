'use strict';

const path = require('path');
const fs = require('fs-extra');
const template = require('../lib/networks-template');
const RenVM = require('@renproject/ren');
const {
  NetworkDetails: {
    NetworkTestnet
  }
} = RenVM;
(async () => {
  const json = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'lib', 'networks-template.json'), 'utf8'));
  Object.assign(json[42], {
    contracts: {
      factory: "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30",
      template: "0x68Da056feB1158B8c4726830cF76B23905A7eb1D",
      shifterPool: '0xbC309534196bC6874414E6f3b9D12D6c82f7111a',
      zeroBTC: '0xad980C650213672389998865C79f30255794Dd37',
      renbtcShifter: NetworkTestnet.contracts.addresses.shifter.zBTC._address,
      renbtc: NetworkTestnet.contracts.addresses.tokens.BTC.address,
      shifterRegistry: NetworkTestnet.contracts.addresses.shifter.ShifterRegistry.address,
      mpkh: NetworkTestnet.contracts.renVM.mpkh,
      linkReferences: {
        BorrowProxyLib: '0xB386FDe324aDc8cE143D2314FecA316a0686331F'
      }
    }
  });
  await fs.writeFile(path.join(__dirname, '..', 'lib', 'networks.json'), JSON.stringify(json, null, 2));
})().catch((err) => console.error(err));
