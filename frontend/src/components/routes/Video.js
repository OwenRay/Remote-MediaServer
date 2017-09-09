/**
 * Created by danielsauve on 7/07/2017.
 */
import React, {Component} from 'react';
import {Button, Preloader} from "react-materialize";
import NavBar from "../components/NavBar.js"
import SeekBar from "../components/SeekBar";

class Video extends Component {

  vidRef = null;
  pageRef = null;

  componentWillMount(){
    this.setState({paused: false, load: false})
  }

  componentDidMount(){
    this.vidRef.onclick = this.togglePause.bind(this);
    this.vidRef.ondblclick = this.toggleFullScreen.bind(this);
    this.vidRef.oncanplay = this.onCanPlay.bind(this);
    this.vidRef.onloadstart = this.onLoading.bind(this);
    this.vidRef.ontimeupdate = this.onProgress.bind(this);
  }

  onProgress(){
    this.setState({progress: this.vidRef.currentTime});
  }

  onLoading(){
    this.setState({loading: true});
  }

  onCanPlay(){
    this.setState({loading: false});
    this.setState({duration: this.vidRef.duration})
  }

  togglePause() {
    if (this.state.paused) {
      this.setState({paused: false});
      this.vidRef.play();
    } else {
      this.setState({paused: true});
      this.vidRef.pause();
    }
  }

  toggleMute() {
    if (this.state.muted){
      this.setState({muted: false, volume: this.state.volumeBeforeMute});
    } else {
      this.setState({muted: true, volumeBeforeMute: this.state.volume, volume: 0});
    }
    this.vidRef.volume = this.state.volume;
  }

  volumeChange(value) {
    this.setState({muted: false, volume: value});
    this.vidRef.volume = this.state.volume;
  }

  onSeek() {

  }

  toggleFullScreen() {
    if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement )
    {
      if (this.pageRef.requestFullscreen) {
        this.pageRef.requestFullscreen();
      } else if (this.pageRef.msRequestFullscreen) {
        this.pageRef.msRequestFullscreen();
      } else if (this.pageRef.mozRequestFullScreen) {
        this.pageRef.mozRequestFullScreen();
      } else if (this.pageRef.webkitRequestFullscreen) {
        this.pageRef.webkitRequestFullscreen();
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
      return <Preloader mode="circular" size="small" flashing style={{zIndex: 99}}/>
    } else if (this.state.paused) {
      return <Button floating large className="play" icon='play_arrow' onClick={this.togglePause.bind(this)} flat/>
    }
  }
  render() {
    return (
    <div className="video" ref={(input) => {this.pageRef = input;}}>
      <video ref={(input) => {this.vidRef = input;}} src="" preload="none" autoPlay/>
      {this.loadingOrPaused()}
      <NavBar paused={this.state.paused} togglePause={this.togglePause.bind(this)} toggleFullScreen={this.toggleFullScreen.bind(this)}>
        <SeekBar id="progress" onSeek={this.onSeek.bind(this)} progress={this.state.progress} max={this.state.duration}/>
        <span className="muteIcon" onClick={this.toggleMute.bind(this)} id="mute" icon="volume_mute"/>
        <SeekBar id="volume" onSeek={this.volumeChange.bind(this)} progress={this.state.volume} max={100}/>
      </NavBar>
    </div>
    )
  }
}
export default Video
