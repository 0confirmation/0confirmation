'use strict';

const Zero = require('@0confirmation/sdk');
const { InfuraProvider } = require('@ethersproject/providers');

test('it can construct a Zero', () => {
const zero = new Zero(new InfuraProvider('mainnet'), 'mainnet');
})

