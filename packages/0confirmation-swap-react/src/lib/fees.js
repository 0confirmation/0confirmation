import axios from 'axios';
import BN from 'bignumber.js';
import {ChainId, Token, WETH, Route, Pair} from "@uniswap/sdk";
import {RenJS} from '@renproject/ren';
import {ethers} from 'ethers';
import {InfuraProvider} from '@ethersproject/providers';

const renBTC = new Token (ChainId.MAINNET, '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d', 18);
const pair = async() =>  (await Pair.fetchData(renBTC, WETH[renBTC.chainId]));
const route = async() => new Route([await pair()], WETH[renBTC.chainId]);
export var price = async() => (await route()).midPrice.toSignificant(5)*10000000000;

let renjs = new RenJS('mainnet')
let address = renjs.network.addresses.gateways.BTCGateway.artifact.networks[1].address

const abi =[{
    type: 'function',
    name: 'mintFee',
    inputs:[],
    outputs:[{
        type:'uint256',
        name:'some-output-name-doesnt-matter'}]}]
;
const renGatewayContract = new ethers.Contract(address, abi, new InfuraProvider('mainnet','2f1de898efb74331bf933d3ac469b98d' ))

export let getFast = async() => (await axios.get('https://ethgasstation.info/api/ethgasAPI.json')).data.fast;
var x=new  BN('1.46e6');
var y=new BN('1e10');
var z=new BN('1e18');
var fee=new BN('.0007');
var BNprice= async => await new BN(price);
var value= async() => (((BN(await getFast).times(x)).div(y)).times(await BNprice))+((await swapAmount.times(mintFee(renGatewayContract))).div(z)+fee);
console.log(value);
//Fee in swapped to asset = Fee in BTC * price of swapped to Asset in BTC
