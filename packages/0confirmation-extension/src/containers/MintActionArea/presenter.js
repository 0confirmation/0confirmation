export default ({ btcInput, btcAddress, ...restProps }) => {
  const instructionText = `Send ${btcInput} BTC to: ${btcAddress}`;

  return {
    ...restProps,
    instructionText
  };
};
