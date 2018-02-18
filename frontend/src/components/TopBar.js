import React, {Component} from 'react';
import {Icon} from 'react-materialize';

class TopBar extends Component {

  onBackPressed() {
    window.history.back();
  }

  render() {
    return <div className="top-bar">
      {this.props.showBackButton?<a onClick={this.onBackPressed.bind(this)} id="back-btn"><Icon>arrow_back</Icon></a>:""}
      <div className="right">
        {this.props.children}
      </div>
    </div>;
  }
}

export default TopBar;
