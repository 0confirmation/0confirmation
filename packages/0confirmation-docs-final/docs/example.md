---
id: example
title: How to use the SDK?
sidebar_label: Example code snppet
---

Assuming you already know how to initialize a Zero instance, we are going to explain how to create and accept liquidity requests.
****

```
{
  const keeper = await makeZero(keeperProvider);
  const borrower = await makeZero(borrowerProvider);
  await keeper.listenForLiquidityRequests(async (v) => {
    ln(v, 'liquidity request received');
    ln(v.depositAddress, 'deposit here');
    console.log('waiting for deposit ...');
    const deposited = await v.waitForDeposit();
    ln(deposited, 'utxo wrapper created, submit to renvm');
    ln(deposited.computeShiftInTxHash(), 'shiftIn txHash');
    const result = await deposited.submitToRenVM();
    ln(result, 'renvm result');
    console.log(await deposited.waitForSignature());
  });
  const liquidityRequest = borrower.createLiquidityRequest({
    token: kovan.renbtc,
    amount: utils.parseUnits('0.001', 8).toString(),
    nonce: '0x68b7aed3299637f7ed8d02d40fb04a727d89bb3448ca439596bd42d65a6e16cd',
    gasRequested: utils.parseEther('0.01').toString()
  });
  ln(liquidityRequest, 'liquidity request');
  const liquidityRequestParcel = await liquidityRequest.sign();
  ln(liquidityRequestParcel, 'signed liquidity request (parcel)');
  await timeout(5000);
  console.log('broadcasting ...');
  await liquidityRequestParcel.broadcast();
}
```