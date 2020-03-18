import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: "1%"
  },
  titleAndShiftStatusWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    marginBottom: 10
  },
  titleWrapper: {
    flexGrow: 1,
    "& > p": {
      fontFamily: "Monospace",
      fontSize: 14
    }
  },
  shiftStatusWrapper: {
    "& > p": {
      fontFamily: "Monospace",
      fontSize: 14
    }
  },
  tableContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  tableWrapper: {
    width: "70%"
  },
  targetAddressWrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    "& > p": {
      fontFamily: "Monospace",
      fontSize: 10
    }
  },
  withdrawButtonWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    "& > button": {
      border: "1px solid transparent",
      width: "100%",
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
  }
});

export default useStyles;
