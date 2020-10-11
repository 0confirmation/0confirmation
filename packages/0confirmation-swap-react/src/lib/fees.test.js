import {getFees} from './fees';
import WETH9 from 'canonical-weth/build/contracts/WETH9';
import { InfuraProvider } from '@ethersproject/providers';
import { RenVM } from '@0confirmation/renvm';
import { Token, WETH, ChainId } from '@uniswap/sdk';
const renjs = new RenVM('mainnet');
let btcAddress = renjs.network.addresses.tokens.BTC.address;
const wethAddress = WETH9.networks[1].address;
console.log(ChainId.MAINNET);
const renBTC = new Token (ChainId.MAINNET, '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', 8);
const weth = new Token (ChainId.MAINNET, wethAddress, 18);
test('get fast', async () => {
  const fees = await getFees('0.022', renBTC, weth, new InfuraProvider('mainnet'));
    console.log(fees);
})
