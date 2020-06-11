import React, { useEffect, useState } from "react";

const Expire = (props) => {
  const {visible, setVisible} = props;
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
};

export default Expire;
