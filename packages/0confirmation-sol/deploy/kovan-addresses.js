'use strict';

const ren = require('@renproject/ren');

module.exports = {
  factory: "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30",
  template: "0x68Da056feB1158B8c4726830cF76B23905A7eb1D",
  renbtc: ren.NetworkDetails.NetworkTestnet.contracts.addresses.shifter.zBTC._address,
  shifterRegistry: ren.NetworkDetails.NetworkTestnet.contracts.addresses.shifter.ShifterRegistry.address,
  mpkh: ren.NetworkDetails.NetworkTestnet.contracts.renVM.mpkh,
  linkReferences: {
    BorrowProxyLib: '0xfc6C8E816Bc27ec599654637887cAA4Fe37643F6'
  },
  shifterPool: '0x2d64168A5b6FDb1d64734c59538576C807814721',
  zeroBTC: '0x33d25Ea76eA69706554FC1BcF1800d9D03a12A2a'
};
