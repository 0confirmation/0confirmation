import parse from "path-parse";
import { capitalCase } from "change-case";

export const getTradeCurrencyFromRouter = (router) => {
  const parsed = parse(((router || {}).location || {}).pathname || "");
  return parsed.name;
};

export const toCapital = (s) => capitalCase(s || "");

/**
 * Given a number like string verfies if it's a positive number
 * @param {string | number} number
 */
export const isPositiveNumber = (number) => {
  return parseFloat(number.replace(/\s/g, "")) > 0;
};

export const truncateDecimals = (s, e) => {
  s = String(s);
  const i = s.lastIndexOf(".");
  if (~i) {
    const decimals = s.length - i - 1;
    if (decimals <= e) return s;
    return s.substr(0, i + e + 1).replace(/\.$/, "");
  }
  return s;
};

export const coerceToBNInput = (n) => {
  if (isNaN(n)) return "0";
  n = String(n);
  if (n.match(/^\./)) return "0" + n;
  return n;
};
