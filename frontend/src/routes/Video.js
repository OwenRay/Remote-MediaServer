/**
 * Created by danielsauve on 7/07/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {Icon, Button, Preloader, Modal, Row} from "react-materialize";
import NavBar from "../components/player/NavBar.js"
import SeekBar from "../components/player/SeekBar";
import store from "../helpers/stores/apiStore";
import { apiActions, deserialize} from 'redux-jsonapi';
import BodyClassName from 'react-body-classname';
import Html5VideoRenderer from "../components/player/renderer/Html5VideoRenderer";
import ChromeCastRenderer from "../components/player/renderer/ChromeCastRenderer";
import CastButton from "../components/player/CastButton";
import ChromeCast from "../helpers/ChromeCast";

class Video extends Component {
  pageRef = null;

  componentWillMount(){
    ChromeCast.addListener(ChromeCast.EVENT_CASTING_CHANGE, this.onCastingChange.bind(this));
    this.setState({
      paused: false,
      volume:1,
      seek:0,
      progress:0,
      loading: true,
      navClass: "visible",
      renderer:ChromeCast.isActive()?ChromeCastRenderer:Html5VideoRenderer
    });
  }

  componentDidMount(){
    this.lastPosSave = 0;
    this.componentWillReceiveProps(this.props);
    this.navTimeout = setTimeout(this.hide.bind(this), 2000);
  }

  componentWillUnmount() {
    clearTimeout(this.navTimeout);
    ChromeCast.removeListener(ChromeCast.EVENT_CASTING_CHANGE, this.onCastingChange.bind(this));
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

  onCastingChange(casting) {
    this.setState({
      renderer:casting?ChromeCastRenderer:Html5VideoRenderer,
      loading:true
    });
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

  onProgress(progress){
    this.setState({progress, loading:false});
    if(new Date().getTime()-this.lastPosSave>10000)
    {
      this.lastPosSave = new Date().getTime();
      this.savePosition();
    }
  }

  async savePosition() {
    this.pos.position = this.state.progress;
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

  togglePause() {
    this.setState({paused: !this.state.paused});
  }

  toggleMute() {
    if (this.state.muted){
      this.setState({muted: false, volume: this.state.volumeBeforeMute});
    } else {
      this.setState({muted: true, volumeBeforeMute: this.state.volume, volume: 0});
    }
  }

  volumeChange(value) {
    this.setState({muted: false, volume: value});
  }

  onSeek(seek) {
    this.setState({seek, loading:true});
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
    if (this.state.loading) {
      return <Preloader mode="circular" size="small" flashing style={{zIndex: 99}}/>
    } else if (this.state.paused) {
      return <Button floating large className="play" icon='play_arrow' onClick={this.togglePause.bind(this)} flat/>
    }
  }

  onSelectContent(what, channel) {
    if(what==="subtitles") {
      this.setState({subtitle:channel});
      return;
    }

    const o = {seek:this.state.progress};
    o[what] = channel;
    this.setState(o);
  }

  dialogClick(fromPos) {
    console.log(this.pos.position);
    this.setState({seek:fromPos?this.pos.position:0, skippedDialog:true});
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
      <div className={"video "+this.state.navClass} ref={(input) => {this.pageRef = input;}} onMouseMove={this.onMouseMove.bind(this)}>
        <BodyClassName className="hideNav"/>
        <div
          className="wrapper"
          onClick={this.togglePause.bind(this)}
          onDoubleClick={this.toggleFullScreen.bind(this)}
          >
          <this.state.renderer
            mediaItem={this.state.item}
            onProgress={this.onProgress.bind(this)}
            seek={this.state.seek}
            audioChannel={this.state.audio}
            videoChannel={this.state.video}
            subtitle={this.state.subtitle}
            volume={this.state.volume}
            paused={this.state.paused}
            onVolumeChange={this.volumeChange.bind(this)}
            />
        </div>
        <CastButton/>

        {this.loadingOrPaused()}
        <NavBar
          onSelectContent={this.onSelectContent.bind(this)}
          mediaContent={this.state.mediaContent}
          item={this.state.item}
          paused={this.state.paused}
          togglePause={this.togglePause.bind(this)}
          toggleFullScreen={this.toggleFullScreen.bind(this)}>

          <SeekBar
            displayTime={true}
            id="progress"
            onSeek={this.onSeek.bind(this)}
            progress={this.state.progress}
            max={this.state.duration}/>
          <span onClick={this.toggleMute.bind(this)}>
            <Icon id="mute" className="muteIcon">volume_mute</Icon>
          </span>
          <SeekBar id="volume" onSeek={this.volumeChange.bind(this)} progress={this.state.volume} max={1}/>
        </NavBar>
      </div>
    );
  }
}
export default Video
