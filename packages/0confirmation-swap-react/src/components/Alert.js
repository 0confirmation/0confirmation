import React, { useState } from "react";
import Expire from "./expire";

const Alert =  (props) => {
  const [ boldText ] = useState(props.boldText);
  const [ detailText ] = useState(props.detailText);
  const [ alertType ] = useState(props.alertType);
  const [ delay ] = useState(props.delay || 4000);
  const setVisible = useState(false)[1];
    return (
      <Expire delay={delay}>
        <div className={String(alertType)}>
          <span
            className="alert-close"
            onClick={() => {
              setVisible(false);
            }}
          >
            &times;
          </span>
          <p className="sub-header-text vertical-center py-2">
            <b>{boldText}</b> {detailText}
          </p>
        </div>
      </Expire>
    );
  };

export default Alert;
