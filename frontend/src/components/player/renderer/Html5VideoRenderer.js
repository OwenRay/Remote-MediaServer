import React from 'react';
import BaseRenderer from './BaseRenderer';

class Html5VideoRenderer extends BaseRenderer {
  constructor() {
    super();
    this.onProgress = this.onProgress.bind(this);
    this.reInit = this.reInit.bind(this);
    this.onTrackLoad = this.onTrackLoad.bind(this);
    this.onTrackRef = this.onTrackRef.bind(this);
    this.onStart = this.onStart.bind(this);
    this.onStartLoad = this.onStartLoad.bind(this);
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

    if (this.props.seek !== newProps.seek) {
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
    vidRef.addEventListener('play', this.onStart);
    vidRef.addEventListener('loadstart', this.onStartLoad);
  }

  onStart() {
    this.props.onStart();
  }

  reInit() {
    console.warn('playback error!');
    if (this.state && this.state.progress < this.props.mediaItem.fileduration * 0.99) {
      this.props.onSeek(this.state.progress);
    }
  }

  onTrackLoad() {
    this.setOffset(this.props.seek);
  }

  onProgress() {
    if (this.vidRef.readyState === 0) {
      return;
    }
    const progress = this.props.seek + this.vidRef.currentTime;
    this.setState({ progress });
    this.props.onProgress(progress);
  }

  onTrackRef(ref) {
    if (!ref) return;
    ref.addEventListener('load', this.onTrackLoad);
  }

  onStartLoad() {
    this.props.onLoadStarted();
  }

  setOffset(offset) {
    if (!this.activeTrack) return;
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
          webkit-playsinline="webkit-playsinline"
          playsInline="playsInline"
          ref={this.gotVidRef.bind(this)}
          src={this.getVideoUrl()}
          preload="auto"
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
