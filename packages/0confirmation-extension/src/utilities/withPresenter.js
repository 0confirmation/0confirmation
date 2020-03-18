import React from "react";

const withPresenter = presenter => Component => {
  const WithPresenter = props => {
    const presentedProps = presenter(props);
    return <Component {...presentedProps} />;
  };

  return WithPresenter;
};

export default withPresenter;
