/* global document */
import React, { Component } from 'react';
import Time from '../Time';

class SeekBar extends Component {
  constructor() {
    super();
    this.tracker = null;
    this.progress = null;
    this.onClick = this.onClick.bind(this);
    this.onMove = this.onMove.bind(this);
    this.stopSeeking = this.stopSeeking.bind(this);
    this.onMove = this.onMove.bind(this);
  }

  componentWillMount() {
    this.setState({ progress: -1 });
  }

  componentDidMount() {
    this.ell.onmousemove = this.moveTime.bind(this);
  }

  onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    document.onmouseup = this.stopSeeking;
    document.onmousemove = this.onMove;
    this.onMove(e);
  }

  onMove(e) {
    let pos = e.pageX - this.tracker.getBoundingClientRect().left;
    if (pos < 0) {
      pos = 0;
    } else if (pos > this.tracker.offsetWidth) {
      pos = this.tracker.offsetWidth;
    }
    this.setState({ progress: (pos / this.tracker.offsetWidth) * this.props.max });
  }

  moveTime(e) {
    const left = e.pageX - this.tracker.getBoundingClientRect().left;
    this.setState({ mouseX: e.clientX, hint: (left / this.tracker.offsetWidth) * this.props.max });
  }

  stopSeeking() {
    document.onmousemove = null;
    document.onmouseup = null;
    this.props.onSeek(this.state.progress);
    this.setState({ progress: -1 });
  }

  render() {
    return (
      <div ref={(ell) => { this.ell = ell; }} id={this.props.id} onMouseDown={this.onClick}>
        {this.props.displayTime ? (<Time style={{ left: this.state.mouseX }}>{this.state.hint}</Time>) : ''}
        <div className="seektracker" ref={(input) => { this.tracker = input; }}>
          {this.props.displayTime ? [<Time key="1">{this.props.progress}</Time>, <Time key="2">{this.props.max}</Time>] : ''}
          <div
            className="seekprogress"
            ref={(input) => { this.progress = input; }}
            style={{
 width:
                 `${(this.state.progress === -1 ?
                   this.props.progress / this.props.max :
                   this.state.progress / this.props.max) * 100}%`,
               }}
          >
            {this.props.displayTime ? (<Time>{this.props.progress}</Time>) : ''}
            <div />
          </div>
        </div>
      </div>);
  }
}

export default SeekBar;
