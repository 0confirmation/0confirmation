import React from "react";

import useStyles from "./styles";
import { constants } from "./constants";

import Container from "../../components/Container";
import { Typography, TextField, Button } from "@material-ui/core";

const MintActionArea = ({ instructionText, ...restProps }) => {
  const classes = useStyles();
  return (
    <div className={classes.topAdjustedMargin}>
      <Container>
        <div className={classes.contentWrapper}>
          <div className={classes.titleWrapper}>
            <Typography>{constants.title}</Typography>
          </div>
          <div className={classes.textFieldAndButtonWrapper}>
            <div className={classes.textFieldWrapper}>
              <TextField
                variant="outlined"
                size="small"
                label={constants.textfieldTitle}
                className={classes.textField}
                InputLabelProps={{
                  shrink: true
                }}
                InputProps={{
                  fontFamily: "Monospace",
                  fontSize: 10
                }}
              />
            </div>
            <div className={classes.generateButtonWrapper}>
              <Button
                className={classes.generateButton}
                variant="contained"
                disableRipple
                disableElevation
              >
                {constants.buttonText}
              </Button>
            </div>
          </div>
          <div className={classes.instructionTextWrapper}>
            <Typography>{instructionText}</Typography>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MintActionArea;
