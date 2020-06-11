"use strict";

export const saveLoan = (loan) => {
  try {
    const i = String(Number(localStorage.getItem("index") || -1) + 1);
    localStorage.setItem(
      i,
      JSON.stringify({
        token: loan.token,
        amount: String(loan.amount),
        gasRequested: String(loan.gasRequested),
        signature: String(loan.signature),
        nonce: String(loan.nonce),
        actions: loan.actions,
        forbidLoan: loan.forbidLoan,
      })
    );
    localStorage.setItem("index", i);
  } catch (e) {
    // eslint-disable-line
  }
  return loan;
};
