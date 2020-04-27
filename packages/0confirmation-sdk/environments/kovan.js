delete global._bitcore;
delete global._bitcoreCash;
const RenJS = require('@renproject/ren').default;
delete global._bitcore;
delete global._bitcoreCash;
const testnet = new RenJS('testnet');
const BorrowProxyLib = require('@0confirmation/sol/build/BorrowProxyLib');
const ShifterPool = require('@0confirmation/sol/build/ShifterPool');
const ZeroBTC = require('@0confirmation/sol/build/LiquidityToken');

const getAddress = (artifact) => artifact.networks[42].address;

module.exports = {
  factory: "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30",
  template: "0x68Da056feB1158B8c4726830cF76B23905A7eb1D",
  renbtcShifter: testnet.network.contracts.addresses.shifter.BTCShifter.artifact.networks[42].address,
  renbtc: testnet.network.contracts.addresses.tokens.BTC.address,
  shifterRegistry: testnet.network.contracts.addresses.shifter.ShifterRegistry.address,
  mpkh: testnet.network.contracts.renVM.mpkh,
  linkReferences: {
    BorrowProxyLib: getAddress(BorrowProxyLib)
  },
  shifterPool: getAddress(ShifterPool),
  zeroBTC: getAddress(ZeroBTC)
};
