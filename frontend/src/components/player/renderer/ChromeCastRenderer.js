import React from 'react';
import BaseRenderer from "./BaseRenderer";
import ChromeCast from "../../../helpers/ChromeCast";



class Html5VideoRenderer extends BaseRenderer {
  constructor() {
    super();
    this.onPlay = this.onPlay.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if(newProps.volume!==this.props.volume) {
      ChromeCast.setVolume(newProps.volume);
    }

    if(newProps.paused!==this.props.paused) {
      if(newProps.paused) {
        ChromeCast.pause();
      }else{
        ChromeCast.play();
      }
    }

    this.setState(newProps);
  }

  componentDidMount() {
    this.interval = setInterval(this.refreshOffset.bind(this), 500);
    this.componentWillReceiveProps(this.props);
    ChromeCast.addListener(ChromeCast.EVENT_ONPLAY, this.onPlay);
  }

  componentWillUnmount() {
    ChromeCast.removeListener(ChromeCast.EVENT_ONPLAY, this.onPlay);
    clearInterval(this.interval);
  }

  refreshOffset() {
    this.props.onProgress(this.state.seek+ChromeCast.getOffset());
  }

  onPlay() {
    console.log(ChromeCast.getVolume());
  }

  backDrop() {
    return {backgroundImage:"url(/img/"+this.state.mediaItem.id+"_backdrop.jpg)"};
  }

  componentDidUpdate(props, prevState) {
    const s = this.state;
    if(!prevState||
      s.mediaItem.id!==prevState.mediaItem.id||
      s.seek!==prevState.seek||
      s.audioChannel!==prevState.audioChannel||
      s.videoChannel!==prevState.videoChannel) {
      //ChromeCast.setMedia("http://"+document.location.host+this.getVideoUrl(), "video/mp4");
      ChromeCast.setMedia("http://192.168.111.12:8080"+this.getVideoUrl(), "video/mp4");
    }
  }


  render() {
    if(!this.state) {
      return null;
    }
    return (
      <div className="wrapper" style={this.backDrop()}/>
    );
  }
}


export default Html5VideoRenderer;
