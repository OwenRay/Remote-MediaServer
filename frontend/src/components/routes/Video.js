/**
 * Created by danielsauve on 7/07/2017.
 */
import React, {Component} from 'react';
import {Button, Preloader} from "react-materialize";
import NavBar from "../components/NavBar.js"
import SeekBar from "../components/SeekBar";

class Video extends Component {

  componentWillMount(){
    this.setState({paused: false, load: false})
  }

  componentDidMount(){
    let vid = this.refs.vidRef;
    vid.onclick = this.togglePause.bind(this);
    vid.ondblclick = this.toggleFullScreen.bind(this);
    vid.oncanplay = this.onCanPlay.bind(this);
    vid.onloadstart = this.onLoading.bind(this);
  }

  onLoading(){
    this.setState({loading: true});
  }

  onCanPlay(){
    this.setState({loading: false});
  }

  togglePause() {
    if (this.state.paused) {
      this.setState({paused: false});
      this.refs.vidRef.play();
    } else {
      this.setState({paused: true});
      this.refs.vidRef.pause();
    }
  }

  toggleMute() {
    if (this.state.muted){
      this.setState({muted: false, volume: this.state.volumeBeforeMute});
    } else {
      this.setState({muted: true, volumeBeforeMute: this.state.volume, volume: 0});
    }
    this.refs.vidRef.volume = this.state.volume;
  }

  toggleFullScreen() {
    let elem = this.refs.vidRef;
    if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement )
    {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  loadingOrPaused() {
    if (this.state.load) {
      return <Preloader mode="circular" size="small"/>
    } else if (this.state.paused) {
      return <Button floating large className="play" icon='play_arrow' onClick={this.togglePause.bind(this)}/>
    }
  }
  render() {
    return (
    <div>
      <video className="video" ref="vidRef" src="TEST SOURCE" preload="none" autoPlay/>
      {this.loadingOrPaused()}
      <NavBar paused={this.state.paused} togglePause={this.togglePause.bind(this)} toggleFullScreen={this.toggleFullScreen.bind(this)}>
        <SeekBar id="progress"/>
        <span className="muteIcon" onClick={this.toggleMute.bind(this)} id="mute" icon="volume_mute"/>
        <SeekBar id="volume"/>
      </NavBar>
    </div>
    )
  }
}
export default Video
