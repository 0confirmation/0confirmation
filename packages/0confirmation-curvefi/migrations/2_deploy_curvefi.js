const Curvefi = artifacts.require('Curvefi');
const CurveToken = artifacts.require('CurveToken');
const WBTC = artifacts.require('WBTC');

const ethers = require('ethers');

const env = require('@0confirmation/sdk/environments');

const kovan = env.getAddresses('kovan');

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
