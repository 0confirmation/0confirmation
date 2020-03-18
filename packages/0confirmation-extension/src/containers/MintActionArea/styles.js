import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  topAdjustedMargin: {
    marginBottom: 10
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: "1%",
    width: "100%"
  },
  titleWrapper: {
    marginBottom: 10,
    "& > p": {
      fontSize: 14,
      fontFamily: "Monospace"
    }
  },
  textFieldAndButtonWrapper: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    marginBottom: 20
  },
  textFieldWrapper: {
    flexGrow: 1,
    "& > div > label": {
      fontFamily: "Monospace",
      color: "#303030",
      "& > div > input": {
        fontFamily: "Monospace",
        color: "#303030"
      }
    }
  },
  textField: {
    "& .MuiFormLabel-root.Mui-focused": {
      color: "#303030"
    },
    "& .label.Mui-focused": {
      color: "#303030"
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#303030"
      },
      "&:hover fieldset": {
        borderColor: "#303030"
      },
      "&.Mui-focused fieldset": {
        borderColor: "#303030"
      }
    }
  },
  generateButtonWrapper: {
    paddingRight: "2%",
    "& > button": {
      border: "1px solid transparent",
      backgroundColor: "#303030",
      transition: "none",
      "&:hover": {
        border: "1px solid white",
        backgroundColor: "#303030"
      },
      "& > span": {
        color: "white",
        fontFamily: "Monospace",
        fontWeight: "bold",
        fontSize: 9
      }
    }
  },
  instructionTextWrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    "& > p": {
      fontSize: 10,
      fontFamily: "Monospace",
      fontWeight: 600
    }
  }
});

export default useStyles;
