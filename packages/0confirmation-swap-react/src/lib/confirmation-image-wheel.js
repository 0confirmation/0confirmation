import zeroCfSvg from "../images/0.svg";
import oneCfSvg from "../images/1.svg";
import twoCfSvg from "../images/2.svg";
import threeCfSvg from "../images/3.svg";
import fourCfSvg from "../images/4.svg";
import fiveCfSvg from "../images/5.svg";
import sixCfSvg from "../images/6.svg";

export const confirmationSvgs = {
  'N/A': zeroCfSvg,
  "0": zeroCfSvg,
  "1": oneCfSvg,
  "2": twoCfSvg,
  "3": threeCfSvg,
  "4": fourCfSvg,
  "5": fiveCfSvg,
  "6": sixCfSvg,
};

export const getSvgForConfirmations = (amount) => confirmationSvgs[amount];
