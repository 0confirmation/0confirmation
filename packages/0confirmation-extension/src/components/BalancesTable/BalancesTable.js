import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@material-ui/core";

import useStyles from "./styles";

const BalancesTable = ({ rows }) => {
  const classes = useStyles();
  return (
    <TableContainer>
      <Table size="small" stickyHeader={false}>
        <TableHead>
          <TableRow>
            <TableCell align="left">{""}</TableCell>
            <TableCell align="right">Target Account</TableCell>
            <TableCell align="right">To Trade</TableCell>
            <TableCell align="right">To Withdraw</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.name}>
              <TableCell align="left">{row.name}</TableCell>
              <TableCell align="right">{row.targetAccount}</TableCell>
              <TableCell align="right">{row.toTrade}</TableCell>
              <TableCell align="right">{row.toWithdraw}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BalancesTable;
