import React, {Component} from 'react';

class SeekBar extends Component {
  tracker = null;
  buffer = null;
  progress = null;

  componentWillMount(){
    this.setState({barWidth: 0})
  }

  componentDidMount(){
    this.setState({barWidth: this.tracker.offsetWidth})
  }

  componentWillReceiveProps(nextProps){
  }

  render() {
    return (
      <div className="seektracker" id={this.props.id} ref={(input) => {this.tracker = input}}>
      <div className="seekbuffer" ref={(input) => {this.buffer = input}}/>
      <div className="seekprogress" ref={(input) => {this.progress = input}} style={{width: this.state.barWidth*(this.props.progress/this.props.max) + "px"}}>
        <div/>
      </div>
    </div>)
  }
}

export default SeekBar
