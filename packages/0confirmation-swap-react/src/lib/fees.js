import axios from 'axios';
import BN from 'bignumber.js';
import {ChainId, Token, WETH, Route, Pair} from "@uniswap/sdk";
import {RenVM} from '@0confirmation/renvm';
import {ethers} from 'ethers';
import {InfuraProvider} from '@ethersproject/providers';
import { mapValues } from 'lodash';
import  provider  from './provider';
const { RenJS } = RenVM;

const renBTC = new Token (ChainId.MAINNET, '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', 18);
const getPair = async(renbtc, weth, provider) =>  (await Pair.fetchData(renbtc, weth, provider));
const getRoute = async(renbtc, weth, provider) => new Route([await getPair(renbtc, weth, provider)], weth);
export var getPrice = async(renbtc, weth, provider) => new BN((await getRoute(renbtc, weth, provider)).midPrice.toSignificant(5)*10000000000);

let renjs = new RenJS('mainnet')
let btcGatewayAddress = '0xe4b679400F0f267212D5D812B95f58C83243EE71'

const abi =[{
    type: 'function',
    name: 'mintFee',
    stateMutability: 'view',
    inputs:[],
    outputs:[{
        type:'uint256',
        name:'some-output-name-doesnt-matter'}]}]
;
const renGatewayContract = new ethers.Contract(btcGatewayAddress, abi, provider.asEthers());

export let getFast = async () => (await axios.get('https://ethgasstation.info/api/ethgasAPI.json')).data.fast;
var gasEstimate=new  BN('1.46e6');
var divisorForGwei =new BN('1e8');
var oneEther =new BN('1e18');
var baseMintFee =new BN('0.0007');

export const PERCENTAGE_PRECISION = 2;
export const PRETTY_AMOUNT_PRECISION = 4;
export const ETH_GAS_FEE_PRECISION = 6;
export const GAS_PRICE_PRECISION = 2;

export const invalidToZero = (v) => ((typeof v === 'object' && v.dividedBy ? (v) => new BN(v) : (v) => v))(isNaN(Number(String(v).replace('%', ''))) ? (0).toFixed(String(v).indexOf('%') !== -1 ? PERCENTAGE_PRECISION : PRETTY_AMOUNT_PRECISION) + (String(v).indexOf('%') !== -1 ? '%' : '') : v);

export const walkObject = (v, fn) => {
  const isPlainObject = typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
  if (isPlainObject) return mapValues(v, (v) => walkObject(v, fn));
  return fn(v);
};

export const coerceNaNsToZero = (o) => walkObject(o, invalidToZero);

const addData = (o, fast, ethGasFee) => {
  const result = addPercentages(addAggregateFees(o));
  result.fastGasPrice = new BN(fast).dividedBy(10).toFixed(GAS_PRICE_PRECISION);
  result.totalGasCostEth = ethGasFee.toFixed(ETH_GAS_FEE_PRECISION);
  return result;
};

const addPercentages = (o) => Object.keys(o).reduce((r, v) => {
  r[v] = {
    prettyAmount: o[v].amount.toFixed(PRETTY_AMOUNT_PRECISION),
    percentage: o[v].ratio.multipliedBy(100) + '%',
    //o[v].ratio.multipliedBy(100).toFixed(PERCENTAGE_PRECISION) + '%',
    ...o[v]
  };
  return r;
}, {});

const addAggregateFees = (o) => {
  return {
    ...o,
      loanFee: ['daoFee', 'keeperFee', 'liquidityPoolFee'].reduce((r, v) => {
        r.amount = r.amount.plus(o[v].amount);
        r.ratio = r.ratio.plus(o[v].ratio);
        return r;
      }, {
          amount: new BN(0),
          ratio: new BN(0)
      }),
      totalFees: Object.keys(o).reduce((r, v) => {
        r.amount = r.amount.plus(o[v].amount);
        r.ratio = r.ratio.plus(o[v].ratio);
        return r;
      }, {
        amount: new BN(0),
        ratio: new BN(0)
      })
    };
};

export const DEFAULT_FEES = addData({
  keeperFee: {
    ratio: new BN('0.0005'),
    amount: new BN('0')
  },
  daoFee: {
    ratio: new BN('0'),
    amount: new BN('0')
  },
  btcGasFee: {
    ratio: new BN('0'),
    amount: new BN('0')
  },
  mintFee: {
    ratio: new BN('0'),
    amount: new BN('0')
  },
  liquidityPoolFee: {
    ratio: new BN('0.0005'),
    amount: new BN('0')
  },
  baseFee: {
    amount: new BN('0.0007'),
    ratio: new BN('0')
  }
}, 0, 0);

export const getFees = async (swapAmount, renbtc, weth, provider) => {
  const mintFeeProportion = new BN(String(await renGatewayContract.mintFee())).multipliedBy(new BN('0.0001'));
  const mintFee = mintFeeProportion.multipliedBy(swapAmount);
  const fast = new BN(await getFast());
  const ethGasFee = gasEstimate.multipliedBy(divisorForGwei).multipliedBy(fast).dividedBy(oneEther);
  const btcGasFee = ethGasFee.dividedBy(new BN(10).pow(10)).multipliedBy(await getPrice(renbtc, weth, provider));
    const btcGasFeeProportion = Number(swapAmount) == 0 ? new BN(0) : btcGasFee.dividedBy(swapAmount);
  const keeperFeeProportion = DEFAULT_FEES.keeperFee.ratio;
  const keeperFee = keeperFeeProportion.multipliedBy(swapAmount);
  const daoFeeProportion = DEFAULT_FEES.daoFee.ratio;
  const daoFee = daoFeeProportion.multipliedBy(swapAmount);
  const liquidityPoolFeeProportion = DEFAULT_FEES.liquidityPoolFee.ratio;
  const liquidityPoolFee = liquidityPoolFeeProportion.multipliedBy(swapAmount);
  const baseFee = DEFAULT_FEES.baseFee.amount.multipliedBy('1');
    const baseFeeProportion = Number(swapAmount) != 0 ? new BN(baseFee).dividedBy(swapAmount) : new BN(0);
  const totalFeeProportion = [ mintFeeProportion, btcGasFeeProportion, keeperFeeProportion, daoFeeProportion, liquidityPoolFeeProportion, baseFeeProportion ].reduce((r, v) => r.plus(v), new BN(0));
  const totalFee = totalFeeProportion.multipliedBy(swapAmount);
  return coerceNaNsToZero(addData({
    mintFee: {
      ratio: mintFeeProportion,
      amount: mintFee
    },
    btcGasFee: {
      ratio: btcGasFeeProportion,
      amount: btcGasFee
    },
    keeperFee: {
      ratio: keeperFeeProportion,
      amount: keeperFee
    },
    daoFee: {
      amount: daoFee,
      ratio: daoFeeProportion
    },
    liquidityPoolFee: {
      ratio: liquidityPoolFeeProportion,
      amount: liquidityPoolFee
    },
    baseFee: {
      amount: baseFee,
      ratio: baseFeeProportion
    },
    totalFee: {
      ratio: totalFeeProportion,
      amount: totalFee
    }
  }, fast, ethGasFee));
};

  
//Fee in swapped to asset = Fee in BTC * getPrice of swapped to Asset in BTC
