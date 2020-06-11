import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

const { test, expect } = window;

test("renders learn react link", () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/0cf/i);
  expect(linkElement).toBeInTheDocument();
});
