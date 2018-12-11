import React from 'react';
import BaseRenderer from './BaseRenderer';

class Html5VideoRenderer extends BaseRenderer {
  constructor() {
    super();
    this.onProgress = this.onProgress.bind(this);
    this.reInit = this.reInit.bind(this);
    this.onTrackLoad = this.onTrackLoad.bind(this);
    this.onTrackRef = this.onTrackRef.bind(this);
  }

  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.volume !== this.props.volume) {
      this.vidRef.volume = newProps.volume;
    }

    if (newProps.subtitle !== this.props.subtitle) {
      if (this.activeTrack) {
        this.activeTrack.mode = 'hidden';
      }
      const tracks = this.vidRef.textTracks;
      this.activeTrack = Object.keys(tracks).find(i => tracks[i].id === newProps.subtitle);
      if (this.activeTrack) {
        this.activeTrack = tracks[this.activeTrack];
        this.activeTrack.mode = 'showing';
        this.setOffset(newProps.seek);
      }
    }

    if (this.props.seek !== newProps.seek && this.activeTrack) {
      this.setOffset(newProps.seek);
    }

    if (newProps.paused !== this.props.paused) {
      if (newProps.paused) {
        this.vidRef.pause();
      } else {
        this.vidRef.play();
      }
    }
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

  onTrackLoad() {
    this.setOffset(this.props.seek);
  }

  onProgress() {
    if (this.vidRef.readyState === 0) {
      return;
    }
    this.setState({ progress: this.props.seek + this.vidRef.currentTime });
    this.props.onProgress(this.state.progress);
  }

  onTrackRef(ref) {
    if (!ref) return;
    ref.addEventListener('load', this.onTrackLoad);
  }

  setOffset(offset) {
    if (!this.activeTrack.subtitleOffset) this.activeTrack.subtitleOffset = 0;
    const items = Array.from(this.activeTrack.cues);
    if (!items.length) return;
    items.forEach((cue) => {
      cue.startTime -= offset - this.activeTrack.subtitleOffset;
      cue.endTime -= offset - this.activeTrack.subtitleOffset;
    });
    this.activeTrack.subtitleOffset = offset;
  }

  render() {
    return (
      <div className="wrapper">
        <video
          id="video"
          ref={this.gotVidRef.bind(this)}
          src={this.getVideoUrl()}
          preload="none"
          autoPlay
        >
          {this.props.subtitles.map(sub => (
            !sub.value ? '' :
            <track
              ref={this.onTrackRef}
              kind="subtitles"
              src={`/api/mediacontent/subtitle/${this.props.mediaItem.id}/${sub.value}`}
              id={sub.value}
              key={sub.value}
              mode="hidden"
            />))}
        </video>
      </div>
    );
  }
}


export default Html5VideoRenderer;
