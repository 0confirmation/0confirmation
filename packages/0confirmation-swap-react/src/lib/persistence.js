"use strict";

import DepositedLiquidityRequestParcel from '@0confirmation/sdk/deposited-liquidity-request-parcel';
import LiquidityRequestParcel from '@0confirmation/sdk/liquidity-request-parcel';

export const saveLoan = (loan) => {
  try {
    const i = String(Number(localStorage.getItem("index") || -1) + 1);
    loan.localIndex = i;
    localStorage.setItem(
      i,
      JSON.stringify({
        state: loan.utxo ? 'deposited' : 'signed',
        token: loan.token,
        amount: String(loan.amount),
        gasRequested: String(loan.gasRequested),
        shifterPool: loan.shifterPool,
        signature: String(loan.signature),
        nonce: String(loan.nonce),
        actions: loan.actions,
        forbidLoan: loan.forbidLoan,
        utxo: loan.utxo
      })
    );
    localStorage.setItem("index", i);
  } catch (e) {
    // eslint-disable-line
  }
  return loan;
};

export const loadLoan = (i, zero) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(i));
    if (parsed.state === 'signed') {
      const parcel = new LiquidityRequestParcel({
        zero,
        shifterPool: parsed.shifterPool,
        token: parsed.token,
        gasRequested: parsed.gasRequested,
        signature: parsed.signature,
        nonce: parsed.nonce,
        actions: parsed.actions,
        forbidLoan: parsed.forbidLoan
      });
      parcel.localIndex = String(i);
      return parcel;
    } else if (parsed.state === 'deposited') {
      const parcel = new DepositedLiquidityRequestParcel({
        zero,
        shifterPool: parsed.shifterPool,
        token: parsed.token,
        gasRequested: parsed.gasRequested,
        signature: parsed.signature,
        nonce: parsed.nonce,
        actions: parsed.actions,
        forbidLoan: parsed.forbidLoan,
        utxo: parsed.utxo
      });
      parcel.localIndex = i;
    }
  } catch (e) {
    return null;
  }
};

export const loadLoans = (zero) => {
  const index = Number(localStorage.getItem('index'));
  return Array(index + 1).fill(0).map((v, i) => loadLoan(zero, i));
};

export const removeLoan = (i) => {
  localStorage.removeItem(String(i));
};
