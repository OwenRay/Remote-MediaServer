import React, {Component} from 'react';

class SeekBar extends Component {
  tracker = null;
  progress = null;

  componentWillMount(){
    this.setState({barWidth: 0, progress: -1})
  }

  onClick(e){
    e.preventDefault();
    e.stopPropagation();
    document.onmousemove = this.onMove.bind(this);
    document.onmouseup = this.stopSeeking.bind(this);
    this.onMove(e);
  }

  onMove(e){
    let pos = e.pageX - this.tracker.getBoundingClientRect().left;
    if (pos < 0) {
      pos = 0;
    } else if (pos > this.tracker.offsetWidth) {
      pos = this.tracker.offsetWidth;
    }
    this.setState({progress: pos/this.tracker.offsetWidth*this.props.max});
  }

  stopSeeking(){
    document.onmousemove = null;
    document.onmouseup = null;
    this.props.onSeek(this.state.progress);
    this.setState({progress: -1})
  }

  render() {
    return (
      <div id={this.props.id} onMouseDown={this.onClick.bind(this)}>
        <div className="seektracker" ref={(input) => {this.tracker = input}}>
          <div className="seekprogress" ref={(input) => {this.progress = input}}
               style={{width:
                 (this.state.progress === -1 ?
                   this.props.progress/this.props.max  :
                   this.state.progress/this.props.max)*100+"%"
               }}>
            <div/>
          </div>
        </div>
    </div>)
  }
}

export default SeekBar
