const Curvefi = artifacts.require('Curvefi');
const CurveToken = artifacts.require('CurveToken');
const WBTC = artifacts.require('WBTC');

const kovan = require('@0confirmation/sol/environments/kovan');

const ethers = require('ethers');

module.exports = async function(deployer) {
  await deployer.deploy(CurveToken, 'Curve.fi wBTC/renBTC', 'wBTC+renBTC', 8, 0)
  await deployer.deploy(WBTC);
  const wbtc = await WBTC.deployed();
  const curveToken = await CurveToken.deployed();
  await deployer.deploy(Curvefi, [ wbtc.address, kovan.renbtc ], [ wbtc.address, kovan.renbtc ], curveToken.address, '100', ethers.utils.parseEther('0').toString())
  await deployer;
  const curve = await Curvefi.deployed();
  await curveToken.set_minter(curve.address);
};
