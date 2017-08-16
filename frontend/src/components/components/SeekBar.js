import React, {Component} from 'react';

class SeekBar extends Component {
  componentDidMount(){

  }

  render() {
    return (
      <div className="seektracker" id={this.props.id}>
      <div className="seekbuffer"/>
      <div className="seekprogress">
        <div/>
      </div>
    </div>)
  }
}

export default SeekBar
