import axios from 'axios';
import BN from 'bignumber.js';
import {ChainId, Token, WETH, Route, Pair} from "@uniswap/sdk";
import {RenJS} from '@renproject/ren';
import {ethers} from 'ethers';
import {InfuraProvider} from '@ethersproject/providers';

const renBTC = new Token (ChainId.MAINNET, '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', 18);
const getPair = async() =>  (await Pair.fetchData(renBTC, WETH[renBTC.chainId]));
const getRoute = async() => new Route([await getPair()], WETH[renBTC.chainId]);
export var getPrice = async() => new BN((await getRoute()).midPrice.toSignificant(5)*10000000000);

let renjs = new RenJS('mainnet')
let btcGatewayAddress = renjs.network.addresses.gateways.BTCGateway.artifact.networks[1].address

const abi =[{
    type: 'function',
    name: 'mintFee',
    stateMutability: 'view',
    inputs:[],
    outputs:[{
        type:'uint256',
        name:'some-output-name-doesnt-matter'}]}]
;
const renGatewayContract = new ethers.Contract(btcGatewayAddress, abi, new InfuraProvider('mainnet','2f1de898efb74331bf933d3ac469b98d' ))

export let getFast = async () => (await axios.get('https://ethgasstation.info/api/ethgasAPI.json')).data.fast;
var gasEstimate=new  BN('1.46e6');
var divisorForGwei =new BN('1e8');
var oneEther =new BN('1e18');
var baseMintFee =new BN('0.0007');

export const getFees = async (swapAmount) => {
  const mintFeeProportion = new BN(String(await renGatewayContract.mintFee())).dividedBy(new BN('1e8'));
  const mintFee = mintFeeProportion.multipliedBy(swapAmount);
  const fast = new BN(await getFast());
  const btcGasFee = gasEstimate.multipliedBy(divisorForGwei).multipliedBy(fast).dividedBy(oneEther).multipliedBy(await getPrice());
  const btcGasFeeProportion = btcGasFee.dividedBy(swapAmount);
  const keeperFeeProportion = new BN('0.001');
  const keeperFee = keeperFeeProportion.multipliedBy(swapAmount);
  const daoFeeProportion = new BN('0');
  const daoFee = daoFeeProportion.multipliedBy(swapAmount);
  const liquidityPoolFeeProportion = new BN('0.001');
  const liquidityPoolFee = liquidityPoolFeeProportion.multipliedBy(swapAmount);
  const baseFee = baseMintFee.multipliedBy('1');
  const baseFeeProportion = new BN(baseFee).dividedBy(swapAmount);
  const totalFeeProportion = [ mintFeeProportion, btcGasFeeProportion, keeperFeeProportion, daoFeeProportion, liquidityPoolFeeProportion, baseFeeProportion ].reduce((r, v) => r.plus(v), new BN(0));
  const totalFee = totalFeeProportion.multipliedBy(swapAmount);
  return {
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
  };
};
    
  
//Fee in swapped to asset = Fee in BTC * getPrice of swapped to Asset in BTC
