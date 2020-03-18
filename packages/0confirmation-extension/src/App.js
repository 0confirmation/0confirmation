import React from "react";

import useStyles from "./styles";

import MintActionArea from "./containers/MintActionArea";
import BalancesAndWithdrawActionArea from "./containers/BalancesAndWithdrawActionArea";

const App = () => {
  const classes = useStyles();
  console.log("Im here", window.ethereum);
  return (
    <>
      <MintActionArea
        btcInput=".2008"
        btcAddress="122xh4nJSDrN6K3zqY5R64by2ZX14P3yvn"
        classNames={classes}
      />
      <BalancesAndWithdrawActionArea
        targetAddress="122xh4nJSDrN6K3zqY5R64by2ZX14P3yvn"
        shiftConfirmations={1}
      />
    </>
  );
};

export default App;
