import React from "react";

export default class Expire extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: true };
  }

  componentWillReceiveProps(nextProps) {
    // reset the timer if children are changed
    if (nextProps.children !== this.props.children) {
      this.setTimer();
      this.setState({ visible: true });
    }
  }

  componentDidMount() {
    this.setTimer();
  }

  setTimer() {
    // clear any existing timer
    if (this._timer != null) {
      clearTimeout(this._timer);
    }

    // hide after `delay` milliseconds
    this._timer = setTimeout(
      function () {
        this.setState({ visible: false });
        this._timer = null;
      }.bind(this),
      this.props.delay
    );
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

  render() {
    return this.state.visible ? (
      <div className="fadeIn">{this.props.children}</div>
    ) : (
      <div className="fadeOut">{this.props.children}</div>
    );
  }
}
