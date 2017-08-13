import React, {Component} from 'react';
import {Button} from "react-materialize";
class NavBar extends Component {

  playPauseButton() {
    if (this.props.paused){
      return <Button id="play-pause" floating large icon='play_arrow' onClick={this.props.togglePause}/>
    } else {
      return <Button id="play-pause" floating large icon='pause' onClick={this.props.togglePause}/>
    }
  }

  render() {
    return (
      <div class="controls">
        <image src="TEST SOURCE"/>
        <Button id="prev" floating medium icon="skip_previous"/>
        {this.playPauseButton()}
        <Button id="next" floating medium icon="skip_next"/>
        <div class="buttonsRight">
          {/**
           Add channel selection logic
           */}
           <Button id="fullscreen" icon="fullscreen" onClick={this.props.toggleFullScreen}/>
        </div>
        {/**
         Add Seek Bars
         */}
      </div>
    )
  }
}

export default NavBar
