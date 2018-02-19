/**
 * Created by danielsauve on 7/07/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {Button, Preloader, Modal, Row} from "react-materialize";
import NavBar from "../components/player/NavBar.js"
import SeekBar from "../components/player/SeekBar";
import Subtitles from "../components/player/Subtitles";
import store from "../../stores/apiStore";
import { apiActions, deserialize} from 'redux-jsonapi';
import BodyClassName from 'react-body-classname';

class Video extends Component {
  vidRef = null;
  pageRef = null;

  componentWillMount(){
    this.setState({paused: false, volume:1, playOffset:0, progress:0, load: false, navClass: "visible"});
  }

  componentDidMount(){
    this.lastPosSave = 0;
    this.componentWillReceiveProps(this.props);
  }

  gotVidRef(vidRef) {
    if(!vidRef||this.vidRef===vidRef)
      return;
    this.vidRef = vidRef;
    vidRef.onclick = this.togglePause.bind(this);
    vidRef.ondblclick = this.toggleFullScreen.bind(this);
    vidRef.oncanplay = this.onCanPlay.bind(this);
    vidRef.onloadstart = this.onLoading.bind(this);
    vidRef.ontimeupdate = this.onProgress.bind(this);
    vidRef.onerror = this.reInit.bind(this);
    vidRef.onended = this.reInit.bind(this);
    this.navTimeout = setTimeout(this.hide.bind(this), 2000);
  }

  async componentWillReceiveProps (nextProps) {
    if (this.id === nextProps.match.params.id) {
      return;
    }
    this.id = nextProps.match.params.id;
    const request = await store.dispatch(apiActions.read({_type:"media-items",id:this.id}));
    const i = deserialize(request.resources[0], store);

    this.pos = {};
    if(i.playPosition) {
      this.pos = await i.playPosition();
    }
    this.pos._type = "play-positions";
    this.setState({item:i, duration:i.fileduration, skippedDialog:!this.pos.position});
    $.getJSON("/api/mediacontent/"+this.id)
      .then(this.mediaContentLoaded.bind(this));

  }

  async mediaContentLoaded(mediaContent) {
    if(mediaContent.subtitles.length) {
      mediaContent.subtitles.push({value:"",label:"Disable"});
    }
    this.setState({mediaContent})
  }

  reInit() {
    if(this.state.playOffset+this.state.progress<this.state.duration*0.99) {
      console.log("?", this.state.playOffset+this.state.progress);
      this.setState({playOffset:this.state.playOffset+this.state.progress, progress: 0, loading:true});
    }
  }

  onMouseMove(){
    this.setState({navClass:"visible"});
    clearTimeout(this.navTimeout);
    this.navTimeout = setTimeout(this.hide.bind(this), 2000);
  }

  hide(){
    clearTimeout(this.navTimeout);
    this.setState({navClass:"hidden"})
  }

  onProgress(){
    if(!this.state.loading&&this.vidRef) {
      this.setState({progress: this.vidRef.currentTime});
      if(new Date().getTime()-this.lastPosSave>10000)
      {
        this.lastPosSave = new Date().getTime();
        this.savePosition();
      }
    }
  }

  async savePosition() {
    this.pos.position = this.state.progress + this.state.playOffset;
    let posResult = await store.dispatch(apiActions.write(this.pos));

    if(!this.pos.id) {
      this.state.item._type = "media-items";
      this.state.item.playPosition = ()=>{
        const p = this.pos = deserialize(posResult.resources[0], store);
        p._type = "play-positions";
        return p;
      };

      store.dispatch(apiActions.write(this.state.item));
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
    if(what==="subtitles") {
      this.setState({subtitle:channel});
      return;
    }

    const o = {playOffset:this.state.playOffset+this.state.progress};
    console.log(o, this.state);
    o[what] = channel;
    this.setState(o);
  }

  dialogClick(fromPos) {
    console.log(this.pos.position);
    this.setState({playOffset:fromPos?this.pos.position:0, skippedDialog:true});
  }

  render() {
    if(!this.state.item) {
      return (
        <div className="video">
          <BodyClassName className="hideNav"/>
          <Preloader mode="circular" size="small" flashing style={{zIndex: 99}}/>
        </div>)
    }

    if(!this.state.skippedDialog&&this.pos.position) {
      return (
        <div className="video">
          <BodyClassName className="hideNav"/>
          <div
            className="movie-detail-backdrop"
            style={{backgroundImage:"url(/img/"+this.state.item.id+"_backdrop.jpg)"}}/>
          <Modal
            style={{display:"block"}}
            id="createModal"
            actions={[
              <Button onClick={()=>{this.dialogClick()}} modal="close">
                Start from beginning
              </Button>,
              <Button onClick={()=>{this.dialogClick(true)}} modal="confirm">
                Continue watching
              </Button>,
            ]}>
            <h4>Continue watching?</h4>
            <Row>
              You watched untill <b>{Math.ceil(this.pos.position/60)}m</b>, continue watching?
            </Row>
          </Modal>
        </div>
      );
    }

    return (
      <div className="video" ref={(input) => {this.pageRef = input;}} onMouseMove={this.onMouseMove.bind(this)}>
        <BodyClassName className="hideNav"/>
        <video
          className={this.state.navClass}
          ref={this.gotVidRef.bind(this)}
          src={this.getVideoUrl()}
          preload="none"
          autoPlay />
        <Subtitles
          vidRef={this.vidRef}
          item={this.state.item}
          file={this.state.subtitle}
          progress={this.state.playOffset+this.state.progress} />

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
    );
  }
}
export default Video
