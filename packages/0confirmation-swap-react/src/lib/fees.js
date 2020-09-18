import axios from 'axios';
import BN from 'bignumber.js';
import uniswap from '@uniswap/sdk'
import {getRenBTCToken, getWETHToken} from "../component/App.js" 
import {InfuraProvider} from "@ethersproject/providers"

const provider = new InfuraProvider ("mainnet")
const getWETHRenBTCMarket = async (provider) => {
  const route = new UniRoute(
    [
      await Pair.fetchData(getRenBTCToken(), getWETHToken(), provider),
    ],
      getRenBTCToken());
  return route;
};




export let getFast = async() => (await axios.get('https://ethgasstation.info/api/ethgasAPI.json')).data.fast;
x=new BN('1.46e6')
y=new BN('1e10')
value = ((BN(getFast).times(x)).div(y))*
//(btc price in terms of eth)
// pro.coinbase.com/trade/ETH-BTC maybe?
//+(swap amount) *
    //internal value
//call mintFee() /1e18 + .0007

//Fee in swapped to asset = Fee in BTC * price of swapped to Asset in BTC
