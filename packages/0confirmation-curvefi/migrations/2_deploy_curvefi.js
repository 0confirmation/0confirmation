const Curvefi = artifacts.require('Curvefi');
const CurveToken = artifacts.require('CurveToken');

const kovan = require('@0confirmation/sol/environments/kovan');

const WBTC = '0x0000000000000000000000000000000000000001'; // make something up
const ethers = require('ethers');

const curveTokens = [ WBTC, kovan.renbtc ];

module.exports = async function(deployer) {
  await deployer.deploy(CurveToken, 'Curve.fi wBTC/renBTC', 'wBTC+renBTC', 8, 0)
  const curveToken = await CurveToken.deployed();
  await deployer.deploy(Curvefi, curveTokens, curveTokens, curveToken.address, '900', ethers.utils.parseEther('0').toString())
  await deployer;
  const curve = await Curvefi.deployed();
  await curveToken.set_minter(curve.address);
};
