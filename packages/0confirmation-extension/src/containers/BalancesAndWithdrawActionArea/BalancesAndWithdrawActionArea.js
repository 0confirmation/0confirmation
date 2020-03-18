import React from "react";

import useStyles from "./styles";
import constants from "./constants";

import Container from "../../components/Container";
import BalancesTable from "../../components/BalancesTable";
import { Typography, Button } from "@material-ui/core";

const BalancesAndWithdrawActionArea = ({
  shiftStatusText,
  targetAddressText,
  tableRows,
  ...restProps
}) => {
  const classes = useStyles();
  return (
    <Container>
      <div className={classes.contentWrapper}>
        <div className={classes.titleAndShiftStatusWrapper}>
          <div className={classes.titleWrapper}>
            <Typography>{constants.title}</Typography>
          </div>
          <div className={classes.shiftStatusWrapper}>
            <Typography>{shiftStatusText}</Typography>
          </div>
        </div>
        <div className={classes.tableContainer}>
          <div className={classes.tableWrapper}>
            <BalancesTable rows={tableRows} />
          </div>
        </div>
        <div className={classes.targetAddressWrapper}>
          <Typography>{targetAddressText}</Typography>
        </div>
        <div className={classes.withdrawButtonWrapper}>
          <Button className={classes.withdrawButton} variant="contained">
            {constants.withdrawButtonText}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default BalancesAndWithdrawActionArea;
