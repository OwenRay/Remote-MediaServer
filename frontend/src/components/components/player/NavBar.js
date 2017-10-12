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
      <div className={"controls ".concat(this.props.navClass)}>
        <img alt="poster" src={this.props.item?"/img/"+this.props.item.id+"_poster.jpg":""}/>
        <Button id="prev" floating icon="skip_previous"/>
        {this.playPauseButton()}
        <Button id="next" floating icon="skip_next"/>
        <div className="buttonsRight">
          {/**
           Add channel selection logic
           */}
           <Button id="fullscreen" floating icon="fullscreen" onClick={this.props.toggleFullScreen}/>
        </div>
        {this.props.children}
      </div>
    )
  }
}

export default NavBar
