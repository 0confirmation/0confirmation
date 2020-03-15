const ren = require('@renproject/ren');

module.exports = {
  factory: "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30",
  template: "0x68Da056feB1158B8c4726830cF76B23905A7eb1D",
  renbtc: ren.NetworkDetails.NetworkTestnet.contracts.addresses.shifter.zBTC._address,
  shifterRegistry: ren.NetworkDetails.NetworkTestnet.contracts.addresses.shifter.ShifterRegistry.address,
  mpkh: ren.NetworkDetails.NetworkTestnet.contracts.renVM.mpkh,
  linkReferences: {
    BorrowProxyLib: '0xB386FDe324aDc8cE143D2314FecA316a0686331F'
  },
  shifterPool: '0xbC309534196bC6874414E6f3b9D12D6c82f7111a',
  zeroBTC: '0xad980C650213672389998865C79f30255794Dd37'
};
