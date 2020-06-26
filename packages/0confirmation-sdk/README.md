# @0confirmation/sdk

The flagship 0confirmation product. Imports all relevant modules to capture any sort of logic you would need for building 0confirmation enabled apps.

## Usage

Instantiate a Zero instance:

```js

const ethers = require('ethers');
const Zero = require('@0confirmation/sdk');
const makePrivateKeyWeb3Provider = require('@0confirmation/providers/private-key-or-seed') // truffle HDWalletProvider doesn't correctly handle personal_sign, but this provider will!
const web3ProviderFromEthersProvider = require('@0confirmation/providers/from-ethers'); // converts an ethers.js provider to a web3 provider

const provider = makePrivateKeyWeb3Provider('a000000000000000000000000000000000000000000000000000000000000000', web3ProviderFromEthersProvider(new ethers.providers.InfuraProvider('mainnet'));

const zero = new Zero(provider, 'mainnet');

await zero.initializeDriver(); // instantiates a WebRTC connection to the network via lendnet.0confirmation.com

```

#### Check liquidity pool renBTC holdings

```js

// instantiate Zero instance

const { makeManagerClass } = require('@0confirmation/eth-manager');
const ERC20 = makeManagerClass(require('@0confirmation/sol/build/DAI')) // will make an ethers.js wrapper compatible with DAI, which is a mock token that exports the ERC20 ABI
const environments = require('@0confirmation/sdk/environments');
const mainnet = environments.getAddresses('mainnet');
const renbtc = new ERC20(mainnet.renbtc, zero.getProvider().asEthers());

const zeroBTC = await zero.getLiquidityTokenFor(mainnet.renbtc);
const liquidityPoolRenBTCHoldings = await renbtc.balanceOf(zeroBTC.address);
console.log(String(liquidityPoolRenBTCHoldings));
```

#### ERC20 approve liquidity pool, then add liquidity

```js

await zero.approveLiquidityToken(mainnet.renbtc)
await (
  await zero.addLiquidity(ethers.utils.parseUnits('10', 8))
).wait(); // lets add 10 renbtc to the pool

```

#### For a keeper, ERC20 approve transfers by the ShifterPool to be able to execute borrows

```js

await (
  await zero.approvePool(mainnet.renbtc)
).wait();
```

#### Create a liquidity request, sign it, broadcast over libp2p, then wait for your borrow proxy


```js

const randomBytes = require('random-bytes').sync;

const liquidityRequest = zero.createLiquidityRequest({
  amount: ethers.utils.parseUnits('0.05', 8),
  gasRequested: ethers.utils.parseEther('0.05'), // request some gas to use your btc with, optional
  nonce: '0x' + randomBytes(32).toString('hex'),
  token: mainnet.renbtc
});

const liquidityRequestParcel = await liquidityRequest.sign();
console.log(liquidityRequestParcel.depositAddress) // outputs the BTC deposit address to initiate the shift
await liquidityRequestParcel.broadcast();
const depositedLiquidityRequestParcel = await liquidityRequestParcel.waitForDeposit();
while (true) {
  const borrowProxy = await depositedLiquidityRequestParcel.getBorrowProxy();
  if (borrowProxy) {
    // can call await borrowProxy.proxy(someContractAddress, calldata, value) to pilot the borrow proxy through supported modules
  } else {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
```

#### Transaction scripts

To run transaction scripts with a borrow, you can either pass an array as follows:

```js

const liquidityRequest = zero.createLiquidityRequest({
  amount: someAmount,
  nonce: someNonce,
  gasRequested: '0',
  token: mainnet.renbtc,
  actions: [{
    to: uniswapRouter,
    calldata: new ethers.utils.Interface(UniswapV2Router01.abi).functions.tokenToTokenSwapInput.encode(...someParameters)
  }]
});

```

Or for examples of how to use a thunk to preprocess a transaction payload, check the 0confirmation-swap-react for usage of Zero.staticPreprocessor to dynamically assemble bytecode for contract creation code which will be executed in a sandbox to compute a list of transactions to execute.

Refer to 0confirmation-sol/contracts/preprocessors/V2SwapAndDrop.sol for an example of a thunk


### TODO

Running a keeper, for now refer to 0confirmation-keeper for example code
