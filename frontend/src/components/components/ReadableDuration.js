import React, {Component} from 'react';

class ReadableDuration extends Component {


  render() {

    return <span>{Math.round(this.props.children/60)+"m"}</span>;
  }
}

export default ReadableDuration;
