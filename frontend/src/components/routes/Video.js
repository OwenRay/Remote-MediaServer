/**
 * Created by danielsauve on 7/07/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {Button, Preloader} from "react-materialize";
import NavBar from "../components/player/NavBar.js"
import SeekBar from "../components/player/SeekBar";
import store from "../../stores/apiStore";
import { apiActions, deserialize} from 'redux-jsonapi';

class Video extends Component {
  vidRef = null;
  pageRef = null;

  componentWillMount(){
    this.setState({paused: false, playOffset:0, load: false, navClass: "visible"});
  }

  componentDidMount(){
    this.vidRef.onclick = this.togglePause.bind(this);
    this.vidRef.ondblclick = this.toggleFullScreen.bind(this);
    this.vidRef.oncanplay = this.onCanPlay.bind(this);
    this.vidRef.onloadstart = this.onLoading.bind(this);
    this.vidRef.ontimeupdate = this.onProgress.bind(this);
    this.vidRef.onerror = this.reInit.bind(this);
    this.vidRef.onended = this.reInit.bind(this);

    this.setState({volume: this.vidRef.volume, navTimeout:setTimeout(this.hide.bind(this), 2000)});
    this.componentWillReceiveProps(this.props);

  }

  async componentWillReceiveProps (nextProps) {
    if (this.id === nextProps.match.params.id) {
      return;
    }
    this.id = nextProps.match.params.id;
    const request = await store.dispatch(apiActions.read({_type:"media-items",id:this.id}));
    const i = deserialize(request.resources[0], store);
    this.setState({item:i, duration:i.fileduration});
    $.getJSON("/api/mediacontent/"+this.id)
      .then(this.mediaContentLoaded.bind(this));

  }

  async mediaContentLoaded(mediaContent) {
    this.setState({mediaContent})
  }

  reInit() {
    if(this.state.playOffset+this.state.progress<this.state.duration*0.99) {
      this.setState({playOffset:this.state.playOffset+this.state.progress, progress: 0, loading:true});
    }
  }

  onMouseMove(e){
    this.setState({navClass:"visible"});
    clearTimeout(this.state.navTimeout);
    this.setState({navTimeout:setTimeout(this.hide.bind(this), 2000)});
  }

  hide(){
    clearTimeout(this.state.navTimeout);
    this.setState({navClass:"hidden"})
  }

  onProgress(){
    if(!this.state.loading) {
      this.setState({progress: this.vidRef.currentTime});
    }
  }

  onLoading(){
    this.setState({loading: true});
  }

  onCanPlay(){
    this.setState({loading: false});
    //this.setState({duration: this.vidRef.duration})
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

  onSeek(value) {
    this.setState({playOffset:value, progress: 0, loading:true});
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

  getVideoUrl() {
    if(!this.state.item) return "";
    const params = [];
    if(this.state.audio!==undefined) {
      params.push("audioChannel=" + this.state.audio);
    }
    if(this.state.video!==undefined) {
      params.push("videoChannel=" + this.state.video);
    }
    return "/ply/"+this.state.item.id+"/"+this.state.playOffset+"?"+params.join("&");
  }

  onSelectContent(what, channel) {
    const o = {playOffset:this.state.playOffset+this.state.progress};
    o[what] = channel;
    this.setState(o);
  }

  render() {
    return (
    <div className="video" ref={(input) => {this.pageRef = input;}} onMouseMove={this.onMouseMove.bind(this)}>
      <video className={this.state.navClass} ref={(input) => {this.vidRef = input;}} src={this.getVideoUrl()} preload="none" autoPlay />
      {this.loadingOrPaused()}
      <NavBar
        onSelectContent={this.onSelectContent.bind(this)}
        mediaContent={this.state.mediaContent}
        item={this.state.item}
        paused={this.state.paused}
        togglePause={this.togglePause.bind(this)}
        toggleFullScreen={this.toggleFullScreen.bind(this)}
        navClass={this.state.navClass}>
        <SeekBar id="progress" onSeek={this.onSeek.bind(this)} progress={this.state.playOffset+this.state.progress} max={this.state.duration}/>
        <span className="muteIcon" onClick={this.toggleMute.bind(this)} id="mute" icon="volume_mute"/>
        <SeekBar id="volume" onSeek={this.volumeChange.bind(this)} progress={this.state.volume} max={1}/>
      </NavBar>
    </div>
    )
  }
}
export default Video
