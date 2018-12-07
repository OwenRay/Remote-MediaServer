/* global window */
import React, { Component } from 'react';
import { Icon } from 'react-materialize';

class TopBar extends Component {
  constructor() {
    super();
    this.onBackPressed = this.onBackPressed.bind(this);
  }

  onBackPressed() {
    window.history.back();
  }

  render() {
    return (
      <div className="top-bar">
        {this.props.showBackButton ? <span onClick={this.onBackPressed} id="back-btn"><Icon>arrow_back</Icon></span> : ''}
        <div className="right">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default TopBar;
