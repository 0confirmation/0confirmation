delete global._bitcore;
delete global._bitcoreCash;
const RenJS = require('@renproject/ren').default;
delete global._bitcore;
delete global._bitcoreCash;
const testnet = new RenJS('testnet');

module.exports = {
  factory: "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30",
  template: "0x68Da056feB1158B8c4726830cF76B23905A7eb1D",
  renbtcShifter: testnet.network.contracts.addresses.shifter.BTCShifter.artifact.networks[42].address,
  renbtc: testnet.network.contracts.addresses.tokens.BTC.address,
  shifterRegistry: testnet.network.contracts.addresses.shifter.ShifterRegistry.address,
  mpkh: testnet.network.contracts.renVM.mpkh,
  linkReferences: {
    BorrowProxyLib: '0xB386FDe324aDc8cE143D2314FecA316a0686331F'
  },
  shifterPool: '0xbC309534196bC6874414E6f3b9D12D6c82f7111a',
  zeroBTC: '0xad980C650213672389998865C79f30255794Dd37'
};
