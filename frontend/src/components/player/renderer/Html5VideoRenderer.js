import React from 'react';
import Subtitles from '../Subtitles';
import BaseRenderer from './BaseRenderer';

class Html5VideoRenderer extends BaseRenderer {
  constructor() {
    super();
    this.onProgress = this.onProgress.bind(this);
    this.reInit = this.reInit.bind(this);
  }

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

  componentWillUnmount() {
    if (!this.vidRef) return;

    this.vidRef.removeEventListener('timeupdate', this.onProgress);
    this.vidRef.removeEventListener('error', this.reInit);
    this.vidRef.removeEventListener('ended', this.reInit);
  }

  gotVidRef(vidRef) {
    if (!vidRef || this.vidRef === vidRef) { return; }
    this.vidRef = vidRef;
    vidRef.addEventListener('timeupdate', this.onProgress);
    vidRef.addEventListener('error', this.reInit);
    vidRef.addEventListener('ended', this.reInit);
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
