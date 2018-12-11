/* eslint-disable no-underscore-dangle */
/* global $,document */
/**
 * Created by danielsauve on 7/07/2017.
 */
import React, { Component } from 'react';
import { Icon, Button, Preloader, Modal, Row } from 'react-materialize';
import { apiActions, deserialize } from 'redux-jsonapi';
import BodyClassName from 'react-body-classname';
import NavBar from '../components/player/NavBar';
import SeekBar from '../components/player/SeekBar';
import store from '../helpers/stores/apiStore';
import Html5VideoRenderer from '../components/player/renderer/Html5VideoRenderer';
import ChromeCastRenderer from '../components/player/renderer/ChromeCastRenderer';
import CastButton from '../components/player/CastButton';
import ChromeCast from '../helpers/ChromeCast';

class Video extends Component {
  constructor() {
    super();
    this.onCastingChange = this.onCastingChange.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onProgress = this.onProgress.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.onSelectContent = this.onSelectContent.bind(this);
    this.volumeChange = this.volumeChange.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.toggleFullScreen = this.toggleFullScreen.bind(this);
    this.volumeChange = this.volumeChange.bind(this);

    this.pageRef = null;
  }

  componentWillMount() {
    ChromeCast.addListener(ChromeCast.EVENT_CASTING_CHANGE, this.onCastingChange.bind(this));
    this.setState({
      paused: false,
      volume: 1,
      seek: 0,
      progress: 0,
      loading: true,
      navClass: 'visible',
      renderer: ChromeCast.isActive() ? ChromeCastRenderer : Html5VideoRenderer,
    });
  }

  componentDidMount() {
    this.lastPosSave = 0;
    this.componentWillReceiveProps(this.props);
    this.navTimeout = setTimeout(this.hide.bind(this), 2000);
  }

  async componentWillReceiveProps(nextProps) {
    if (this.id === nextProps.match.params.id) {
      return;
    }
    this.id = nextProps.match.params.id;
    const request = await store.dispatch(apiActions.read({ _type: 'media-items', id: this.id }));
    const i = deserialize(request.resources[0], store);

    this.pos = {};
    if (i.playPosition) {
      this.pos = await i.playPosition();
    }
    this.pos._type = 'play-positions';
    this.setState({ item: i, duration: i.fileduration, skippedDialog: !this.pos.position });
    $.getJSON(`/api/mediacontent/${this.id}`)
      .then(this.mediaContentLoaded.bind(this));
  }

  componentWillUnmount() {
    clearTimeout(this.navTimeout);
    ChromeCast.removeListener(ChromeCast.EVENT_CASTING_CHANGE, this.onCastingChange.bind(this));
  }

  onCastingChange(casting) {
    this.setState({
      renderer: casting ? ChromeCastRenderer : Html5VideoRenderer,
      loading: true,
    });
  }

  onMouseMove() {
    this.setState({ navClass: 'visible' });
    clearTimeout(this.navTimeout);
    this.navTimeout = setTimeout(this.hide.bind(this), 2000);
  }

  onProgress(progress) {
    this.setState({ progress, loading: false });
    if (new Date().getTime() - this.lastPosSave > 10000) {
      this.lastPosSave = new Date().getTime();
      this.savePosition();
    }
  }

  onSeek(seek) {
    this.setState({ seek, progress: seek, loading: true });
  }

  onSelectContent(what, channel) {
    if (what === 'subtitles') {
      this.setState({ subtitle: channel });
      return;
    }

    const o = { seek: this.state.progress };
    o[what] = channel;
    this.setState(o);
  }

  toggleFullScreen() {
    if (!document.fullscreenElement && // alternative standard method
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement) {
      if (this.pageRef.requestFullscreen) {
        this.pageRef.requestFullscreen();
      } else if (this.pageRef.msRequestFullscreen) {
        this.pageRef.msRequestFullscreen();
      } else if (this.pageRef.mozRequestFullScreen) {
        this.pageRef.mozRequestFullScreen();
      } else if (this.pageRef.webkitRequestFullscreen) {
        this.pageRef.webkitRequestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  loadingOrPaused() {
    if (this.state.loading) {
      return <Preloader mode="circular" size="small" flashing style={{ zIndex: 99 }} />;
    } else if (this.state.paused) {
      return <Button floating large className="play" icon="play_arrow" onClick={this.togglePause} flat />;
    }
    return '';
  }

  togglePause() {
    this.setState({ paused: !this.state.paused });
  }

  toggleMute() {
    if (this.state.muted) {
      this.setState({ muted: false, volume: this.state.volumeBeforeMute });
    } else {
      this.setState({ muted: true, volumeBeforeMute: this.state.volume, volume: 0 });
    }
  }

  volumeChange(value) {
    this.setState({ muted: false, volume: value });
  }

  async savePosition() {
    this.pos.position = this.state.progress;
    this.pos.watched = this.state.progress > this.state.item.fileduration * 0.97;
    const posResult = await store.dispatch(apiActions.write(this.pos));

    if (!this.pos.id) {
      this.state.item._type = 'media-items';
      this.state.item.playPosition = () => {
        const p = deserialize(posResult.resources[0], store);
        this.pos = p;
        p._type = 'play-positions';
        return p;
      };

      store.dispatch(apiActions.write(this.state.item));
    }
  }

  hide() {
    clearTimeout(this.navTimeout);
    this.setState({ navClass: 'hidden' });
  }

  async mediaContentLoaded(mediaContent) {
    if (mediaContent.subtitles.length) {
      mediaContent.subtitles.push({ value: '', label: 'Disable' });
    }
    this.setState({ mediaContent });
  }

  dialogClick(fromPos) {
    this.setState({ seek: fromPos ? this.pos.position : 0, skippedDialog: true });
  }

  render() {
    if (!this.state.item) {
      return (
        <div className="video">
          <BodyClassName className="hideNav" />
          <Preloader mode="circular" size="small" flashing style={{ zIndex: 99 }} />
        </div>);
    }

    if (!this.state.skippedDialog && this.pos.position) {
      return (
        <div className="video">
          <BodyClassName className="hideNav" />
          <div
            className="movie-detail-backdrop"
            style={{ backgroundImage: `url(/img/${this.state.item.id}_backdrop.jpg)` }}
          />
          <Modal
            style={{ display: 'block' }}
            id="continueWatching"
            actions={[
              <Button onClick={() => { this.dialogClick(); }} modal="close">
                Start from beginning
              </Button>,
              <Button onClick={() => { this.dialogClick(true); }} modal="confirm">
                Continue watching
              </Button>,
            ]}
          >
            <h4>Continue watching?</h4>
            <Row>
              You watched untill <b>{Math.ceil(this.pos.position / 60)}m</b>, continue watching?
            </Row>
          </Modal>
        </div>
      );
    }

    return (
      <div className={`video ${this.state.navClass}`} ref={(input) => { this.pageRef = input; }} onMouseMove={this.onMouseMove}>
        <BodyClassName className="hideNav" />
        <div
          className="wrapper"
          onClick={this.togglePause}
          onDoubleClick={this.toggleFullScreen}
        >
          <this.state.renderer
            mediaItem={this.state.item}
            onProgress={this.onProgress}
            seek={this.state.seek}
            audioChannel={this.state.audio}
            videoChannel={this.state.video}
            subtitle={this.state.subtitle}
            volume={this.state.volume}
            paused={this.state.paused}
            subtitles={this.state.mediaContent !== undefined?this.state.mediaContent["subtitles"]:[]}
            onVolumeChange={this.volumeChange}
            />
        </div>
        <CastButton />

        {this.loadingOrPaused()}
        <NavBar
          onSelectContent={this.onSelectContent}
          mediaContent={this.state.mediaContent}
          item={this.state.item}
          paused={this.state.paused}
          togglePause={this.togglePause}
          toggleFullScreen={this.toggleFullScreen}
        >

          <SeekBar
            displayTime
            id="progress"
            onSeek={this.onSeek}
            progress={this.state.progress}
            max={this.state.duration}
          />
          <span onClick={this.toggleMute}>
            <Icon id="mute" className="muteIcon">volume_mute</Icon>
          </span>
          <SeekBar id="volume" onSeek={this.volumeChange} progress={this.state.volume} max={1} />
        </NavBar>
      </div>
    );
  }
}
export default Video;
