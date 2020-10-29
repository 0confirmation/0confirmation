'use strict';

const Zero = require('@0confirmation/sdk');
const RenJS = require('@0confirmation/sdk/renvm');
const fromEthers = require('@0confirmation/providers/from-ethers');
const { InfuraProvider } = require('@ethersproject/providers');

test('can import RenJS and instantiate', async () => {
  const renjs = new RenJS('mainnet');
  const zero = new Zero(fromEthers(new InfuraProvider('mainnet')), 'mainnet');
});
