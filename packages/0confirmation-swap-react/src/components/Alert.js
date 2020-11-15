import React, { useEffect, useState } from "react";

const Alert = (props) => {
  const [boldText] = useState(props.boldText);
  const [alertType] = useState(props.alertType);
  // const [delay] = useState(props.delay || 4000);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    triggerTimer();
    setVisible(true);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [props.delay]);
  const [timer, setTimer] = useState(null);
  const triggerTimer = () => {
    if (timer != null) {
      clearTimeout(timer);
    }
    setTimer(
      setTimeout(() => {
        setVisible(false);
        setTimer(null);
      }, props.delay)
    );
  };
  const body = (
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
        <b>{boldText}</b> {props.detailText}
      </p>
    </div>
  );
  return visible ? (
    <div className="fadeIn">{body}</div>
  ) : (
    <div className="fadeOut">{body}</div>
  );
};

export default Alert;
