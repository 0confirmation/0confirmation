import React from "react";

import useStyles from "./styles";

const Container = ({ children, classNames }) => {
  const classes = useStyles();
  return <div className={[classes.root, classNames].join(" ")}>{children}</div>;
};

export default Container;
