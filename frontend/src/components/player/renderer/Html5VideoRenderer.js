import React from 'react';
import BaseRenderer from "./BaseRenderer";

class Html5VideoRenderer extends BaseRenderer {
  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(newProps) {
    if(newProps.volume!==this.props.volume) {
      this.vidRef.volume = newProps.volume;
    }

    if(newProps.subtitle!==this.props.subtitle) {
      for (let item of this.vidRef.textTracks) {
        if (item.id === newProps.subtitle){
          item.mode = item.mode === "showing"?"hidden":"showing";
        } else {
          item.mode = "hidden";
        }
      }
    }

    if(newProps.paused!==this.props.paused) {
      if(newProps.paused) {
        this.vidRef.pause();
      }else{
        this.vidRef.play();
      }
    }

    this.setState(newProps);
  }

  gotVidRef(vidRef) {
    if (!vidRef || this.vidRef === vidRef)
      return;
    this.vidRef = vidRef;
    vidRef.ontimeupdate = this.onProgress.bind(this);
    vidRef.onerror = this.reInit.bind(this);
    vidRef.onended = this.reInit.bind(this);
  }

  reInit() {
    if(this.state.progress<this.state.mediaItem.fileduration*0.99) {
      this.setState({seek:this.state.progress, loading:true});
    }
  }

  onProgress() {
    this.setState({progress:this.props.seek+this.vidRef.currentTime});
    this.props.onProgress(this.state.progress);
  }

  render() {
    if(!this.state) {
      return null;
    }
    return (
      <div className="wrapper">
        <video
          ref={this.gotVidRef.bind(this)}
          src={this.getVideoUrl()}
          preload="none"
          autoPlay>
          {this.props.subtitles.map(sub => <track kind={"subtitles"} src={"/api/mediacontent/subtitle/" + this.state.mediaItem.id + "/" + sub.value} id={sub.value} key={sub.value} mode="hidden"/>)}
        </video>
      </div>
    );
  }
}


export default Html5VideoRenderer;
