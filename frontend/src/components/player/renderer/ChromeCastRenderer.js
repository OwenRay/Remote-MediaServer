/* global document */
import React from 'react';
import BaseRenderer from './BaseRenderer';
import ChromeCast from '../../../helpers/ChromeCast';


class ChromeCastRenderer extends BaseRenderer {
  constructor() {
    super();
    this.onPlay = this.onPlay.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.volume !== this.props.volume) {
      ChromeCast.setVolume(newProps.volume);
    }

    if (newProps.paused !== this.props.paused) {
      if (newProps.paused) {
        ChromeCast.pause();
      } else {
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
    this.props.onProgress(this.state.seek + ChromeCast.getOffset());
  }

  onPlay() {
    /* @todo get volume */
    this.props.onVolumeChange(ChromeCast.getVolume());
  }

  backDrop() {
    return { backgroundImage: `url(/img/${this.state.mediaItem.id}_backdrop.jpg)` };
  }

  componentDidUpdate(props, prevState) {
    const s = this.state;
    if (!prevState ||
      s.mediaItem.id !== prevState.mediaItem.id ||
      s.seek !== prevState.seek ||
      s.audioChannel !== prevState.audioChannel ||
      s.videoChannel !== prevState.videoChannel ||
      s.subtitles !== prevState.subtitles) {
      console.log(s.subtitles);
      const subtitles = s.subtitles.map(sub => (
        `http://${document.location.host}/api/mediacontent/subtitle/` +
        `${this.state.mediaItem.id}/${sub.value}?offset=${s.seek * -1000}`
      ));
      ChromeCast.setMedia(
        `http://${document.location.host}${this.getVideoUrl()}`,
        'video/mp4',
        subtitles,
        s.subtitles.findIndex(sub => sub.value === s.subtitle),
      );
      return;
    }
    if (prevState && s.subtitle !== prevState.subtitle) {
      ChromeCast.updateSubtitle(s.subtitles.findIndex(sub => sub.value === s.subtitle));
    }
  }


  render() {
    if (!this.state) {
      return null;
    }
    return (
      <div className="wrapper" style={this.backDrop()} />
    );
  }
}


export default ChromeCastRenderer;
