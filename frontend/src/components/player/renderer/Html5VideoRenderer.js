import React from 'react';
import Subtitles from '../Subtitles';
import BaseRenderer from './BaseRenderer';

class Html5VideoRenderer extends BaseRenderer {
  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.volume !== this.props.volume) {
      this.vidRef.volume = newProps.volume;
    }

    if (newProps.paused !== this.props.paused) {
      if (newProps.paused) {
        this.vidRef.pause();
      } else {
        this.vidRef.play();
      }
    }

    this.setState(newProps);
  }

  gotVidRef(vidRef) {
    if (!vidRef || this.vidRef === vidRef) { return; }
    this.vidRef = vidRef;
    vidRef.ontimeupdate = this.onProgress.bind(this);
    vidRef.onerror = this.reInit.bind(this);
    vidRef.onended = this.reInit.bind(this);
  }

  reInit() {
    if (this.state.progress < this.state.mediaItem.fileduration * 0.99) {
      this.setState({ seek: this.state.progress, loading: true });
    }
  }

  onProgress() {
    this.setState({ progress: this.props.seek + this.vidRef.currentTime });
    this.props.onProgress(this.state.progress);
  }

  render() {
    if (!this.state) {
      return null;
    }
    return (
      <div className="wrapper">
        <video
          ref={this.gotVidRef.bind(this)}
          src={this.getVideoUrl()}
          preload="none"
          autoPlay
        />
        <Subtitles
          vidRef={this.vidRef}
          item={this.state.mediaItem}
          file={this.state.subtitle}
          progress={this.state.progress}
        />
      </div>
    );
  }
}


export default Html5VideoRenderer;
