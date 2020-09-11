"use strict";

import DepositedLiquidityRequestParcel from '@0confirmation/sdk/deposited-liquidity-request-parcel';
import LiquidityRequestParcel from '@0confirmation/sdk/liquidity-request-parcel';

export const saveLoan = (loan) => {
  try {
    const isAlreadySaved = loan.localIndex;
    const i = loan.localIndex || String(Number(localStorage.getItem("index") || -1) + 1);
    loan.localIndex = i;
    localStorage.setItem(
      i,
      JSON.stringify({
        state: loan.state === 'forced' ? loan.state : loan.utxo ? 'deposited' : 'signed',
        token: loan.token,
        isReady: loan.isReady,
        amount: String(loan.amount),
        gasRequested: String(loan.gasRequested),
        shifterPool: loan.shifterPool,
        borrower: loan.borrower,
        signature: String(loan.signature),
        nonce: String(loan.nonce),
        actions: loan.actions,
        forbidLoan: loan.forbidLoan,
        utxo: loan.utxo
      })
    );
    if (!isAlreadySaved) localStorage.setItem("index", i);
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
        amount: parsed.amount,
        actions: parsed.actions,
        borrower: parsed.borrower,
        forbidLoan: parsed.forbidLoan
      });
      parcel.isReady = parsed.isReady;
      parcel.state = 'signed';
      parcel.localIndex = String(i);
      return parcel;
    } else if (parsed.state === 'deposited' || parsed.state === 'forced') {
      const parcel = new DepositedLiquidityRequestParcel({
        zero,
        shifterPool: parsed.shifterPool,
        token: parsed.token,
        amount: parsed.amount,
        gasRequested: parsed.gasRequested,
        borrower: parsed.borrower,
        signature: parsed.signature,
        nonce: parsed.nonce,
        actions: parsed.actions,
        forbidLoan: parsed.forbidLoan,
        utxo: parsed.utxo
      });
      parcel.isReady = parsed.isReady;
      parcel.localIndex = i;
      parcel.state = parsed.state;
      return parcel;
    }
  } catch (e) {
    return null;
  }
};

export const loadLoans = (zero) => {
  const index = Number(localStorage.getItem('index'));
  return Array(index + 1).fill(0).map((v, i) => loadLoan(i, zero));
};

export const removeLoan = (i) => {
  localStorage.removeItem(String(i));
};

window.clearLoansDebug = (v) => {
  for (let i = 0; i < Number(localStorage.getItem('index')); i++) {
    localStorage.removeItem(String(i));
  }
  localStorage.removeItem('index');
};
