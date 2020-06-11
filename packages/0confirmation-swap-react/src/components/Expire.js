import React, { useEffect, useState } from "react";

const Expire = (props) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    triggerTimer();
    setVisible(true);
  }, [props.children]);
  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  });
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
  return visible ? (
    <div className="fadeIn">{props.children}</div>
  ) : (
    <div className="fadeOut">{props.children}</div>
  );
};

export default Expire;
