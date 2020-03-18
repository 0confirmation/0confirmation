export default ({
  shiftConfirmations,
  targetAddress,
  balances,
  ...restProps
}) => {
  const createData = (name, targetAccount, toTrade, toWithdraw) => {
    return {
      name,
      targetAccount,
      toTrade,
      toWithdraw
    };
  };

  const shiftStatusText = `Most Recent Shift Status: ${shiftConfirmations}/6`;
  const targetAddressText = `Target Address: ${targetAddress}`;

  let tableRows;

  if (balances) {
    tableRows = [
      createData("renBTC", "0.000", "0.1000", "0.000"),
      createData("ETH", "5.000", "3.720", "0.000"),
      createData("DAI", "527.000", "0.000", "0.000")
    ];
  } else {
    tableRows = [
      createData("renBTC", "0.000", "0.1000", "0.000"),
      createData("ETH", "5.000", "3.720", "0.000"),
      createData("DAI", "527.000", "0.000", "0.000")
    ];
  }

  return { ...restProps, shiftStatusText, targetAddressText, tableRows };
};
