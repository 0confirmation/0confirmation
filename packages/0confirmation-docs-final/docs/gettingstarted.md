---
id: gettingstarted
title: Getting Started
---

## Creating a Zero instance
Zero is the interface that connects to multipe blockchains: Bitcoin and Ethereum. Apart from this, it also connects to the Zero network and RenVM.

You also need to specif the shifter pool, borrow proxy and mpkh contract addresses.
```
const makeZero = async (contracts, provider) => {
  const zero = new Zero({
    backends: {
      ethereum: {
        provider
      },
      btc: {
        network: 'testnet'
      },
      renvm: {
        network: 'testnet'
      },
      zero: {
        multiaddr: '/ip4/127.0.0.1/tcp/9090/ws/p2p-webrtc-star/',
        dht: true
      }
    },
    shifterPool: contracts.shifterPool,
    mpkh: contracts.mpkh,
    borrowProxyLib: contracts.borrowProxyLib
  });
  zero.driver.registerBackend(Object.assign(Object.create(mockBtcBackend), {
    driver: zero.driver
  }));
  zero.driver.registerBackend(Object.assign(Object.create(mockRenVMBackend), {
    driver: zero.driver
  }));
  await zero.initializeDriver();
  await timeout(5000);
  return zero;
};
```
## Keepers listening for Liquidity requests

In order to start listening for liquidity requests, you need to initiate yourself as a keeper.

As a keeper, you're required to stake collateral. The upside is that you receive a return on every repayment towards a borrow proxy.

```
const keeper = await makeZero(keeperProvider);

  await keeper.listenForLiquidityRequests(async (v) => {
    ln(v, 'liquidity request received');
    ln(v.depositAddress, 'deposit here');
    console.log('waiting for deposit ...');

    const deposited = await v.waitForDeposit(;
    ln(deposited, 'utxo wrapper created, submit to renvm');
    ln(deposited.computeShiftInTxHash(), 'shiftIn txHash');

    const result = await deposited.submitToRenVM();

    ln(result, 'renvm result');
    console.log(await deposited.waitForSignature());
  });
```
## How to broadcast liquidity requests

For the sake of simplicity, assume Bob owns BTC and wants to quickly use it on Ethereum. Unfortunately, converting the BTC to ETH is a long process.

1. Deposit on exchange and wait for 'n' confirmations.
2. Exchange to ETH
3. Withdraw from exchange

This is where 0confirmation comes in. Bob can leverage the 0cf extension to request liquidity.

Using the SDK, you can create a liquidity request, sign it to create a 'liquidity request parcel' and broadcast it for keepers to pickup.

```
const liquidityRequest = borrower.createLiquidityRequest({
      token: contracts.zbtc,
      amount: utils.parseUnits('2', 8).toString(),
      nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cd',
      gasRequested: utils.parseEther('0.01').toString()
    });
const liquidityRequestParcel = await liquidityRequest.sign();
    await timeout(2000);
    await liquidityRequestParcel.broadcast();
```

## Derive Proxy address from a Liquidity request