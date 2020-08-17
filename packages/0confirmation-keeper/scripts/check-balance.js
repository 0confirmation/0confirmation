'use strict';

const makeZero = require('../make-zero');
const environment = require('@0confirmation/sdk/environments').getAddresses(process.env.CHAIN === '1' ? 'mainnet' : 'testnet');
const { makeManagerClass } = require('@0confirmation/eth-manager');
const ERC20 = makeManagerClass(require('@0confirmation/sol/build/DAI'));
const { formatUnits } = require('@ethersproject/units');

(async () => {
  const provider = makeZero().getProvider().asEthers();
  const renbtc = new ERC20(environment.renbtc, provider);
  const [ from ] = await provider.listAccounts();
  console.log(formatUnits(await renbtc.balanceOf(from), await renbtc.decimals()));
})().catch((err) => console.error(err));
