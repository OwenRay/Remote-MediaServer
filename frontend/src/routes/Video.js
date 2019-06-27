/* eslint-disable no-underscore-dangle */
/* global document,window */
/**
 * Created by danielsauve on 7/07/2017.
 */
import React, { Component } from 'react';
import { Icon, Button, Preloader, Modal, Row } from 'react-materialize';
import { apiActions, deserialize } from 'redux-jsonapi';
import NavBar from '../components/player/NavBar';
import SeekBar from '../components/player/SeekBar';
import store from '../helpers/stores/store';
import Html5VideoRenderer from '../components/player/renderer/Html5VideoRenderer';
import ChromeCastRenderer from '../components/player/renderer/ChromeCastRenderer';
import OfflineVideoRenderer from '../components/player/renderer/OfflineVideoRenderer';
import CastButton from '../components/player/CastButton';
import ChromeCast from '../helpers/ChromeCast';
import ShortcutArray from '../helpers/ShortcutHelper';
import LocalStorage from '../helpers/LocalStorage';
import autoPlaySupported from '../helpers/autoPlaySupported';
import { connect } from 'react-redux';
import { playQueueActions } from '../helpers/stores/playQueue';

const isTouch = ('ontouchstart' in window);

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
    this.onTouch = this.onTouch.bind(this);
    this.onStart = this.onStart.bind(this);
    this.collapse = this.collapse.bind(this);
    this.restore = this.restore.bind(this);

    this.pageRef = null;
  }

  async componentWillMount() {
    ChromeCast.addListener(ChromeCast.EVENT_CASTING_CHANGE, this.onCastingChange.bind(this));
    this.setState({
      paused: true,
      volume: 1,
      seek: 0,
      progress: 0,
      loading: true,
      navClass: 'visible',
    });
    this.setState({ paused: !(await autoPlaySupported()) });
  }

  componentDidMount() {
    this.lastPosSave = 0;
    this.navTimeout = setTimeout(this.hide.bind(this), 2000);
    this.shortcuts = new ShortcutArray()
      .add(ShortcutArray.EVENT.PAUSE_PLAY, this.togglePause)
      .add(ShortcutArray.EVENT.FULLSCREEN, this.toggleFullScreen)
      .add(ShortcutArray.EVENT.DOWN, () => this.volumeAdjust(-0.1))
      .add(ShortcutArray.EVENT.UP, () => this.volumeAdjust(0.1))
      .add(ShortcutArray.EVENT.RIGHT, () => this.seekBy(20))
      .add(ShortcutArray.EVENT.LEFT, () => this.seekBy(-20))
      .add(ShortcutArray.EVENT.MUTE, this.toggleMute);
  }

  // fetch all this data in the reducer.
  // async componentWillReceiveProps(nextProps) {
  //   const { playing } = nextProps.playQueue;
  //   const { id } = nextProps.match.params;
  //   console.log('newprops!', nextProps, id);
  //   if ((!playing && id) || id !== `${playing.id}`) {
  //     const a = this.props.insertAtCurrentOffsetById(id);
  //     return;
  //   }
  //   if (!playing || (this.state.item && this.state.item.id === playing.id)) return;
  //
  //   this.props.fetchAndQueueTvSeriesFor(playing);
  //
  //   this.pos = {};
  //   if (playing.playPosition) {
  //     this.pos = await playing.playPosition();
  //   }
  //   this.pos._type = 'play-positions';
  //   console.log('setItem;', playing);
  //   this.setState({
  //     item: playing,
  //     duration: playing.fileduration,
  //     skippedDialog: !this.pos.position,
  //     renderer: LocalStorage.isAvailable(playing)
  //       ? OfflineVideoRenderer
  //       : this.state.renderer,
  //   });
  //   $.getJSON(`/api/mediacontent/${playing.id}`)
  //     .then(this.mediaContentLoaded.bind(this));
  // }


  componentWillUnmount() {
    this.shortcuts.off();
    clearTimeout(this.navTimeout);
    ChromeCast.removeListener(ChromeCast.EVENT_CASTING_CHANGE, this.onCastingChange.bind(this));
  }

  onCastingChange(casting) {
    this.setState({
      casting: true,
      loading: true,
    });
  }

  onTouch() {
    if (ChromeCast.isActive()) return;
    if (this.state.navClass === 'visible') {
      this.setState({ navClass: 'hidden' });
    } else {
      this.onMouseMove();
    }
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
    this.setState({
      seek, progress: seek, loading: true, paused: false,
    });
    this.onMouseMove();
  }

  onStart() {
    this.setState({ paused: false });
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

  seekBy(amount) {
    this.onSeek(this.state.progress + amount);
    return <Icon>{ amount < 0 ? 'fast_rewind' : 'fast_forward' }</Icon>;
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
    if (this.state.paused) {
      return <Button floating large className="play" icon="play_arrow" onClick={this.togglePause} flat />;
    } else if (this.state.loading) {
      return <Preloader mode="circular" size="small" flashing style={{ zIndex: 99 }} />;
    }
    return '';
  }

  togglePause() {
    this.setState({ paused: !this.state.paused });
    this.onMouseMove();
    return <Icon>{ this.state.paused ? 'pause' : 'play_arrow'}</Icon>;
  }

  toggleMute() {
    if (this.state.muted) {
      this.setState({ muted: false, volume: this.state.volumeBeforeMute });
      return <Icon>volume_up</Icon>;
    }
    this.setState({ muted: true, volumeBeforeMute: this.state.volume, volume: 0 });
    this.onMouseMove();
    return <Icon>volume_off</Icon>;
  }

  volumeAdjust(adjustBy) {
    this.volumeChange(this.state.volume + adjustBy);
    return <Icon>{adjustBy < 0 ? 'volume_down' : 'volume_up'}</Icon>;
  }

  volumeChange(value) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;
    this.onMouseMove();
    this.setState({ muted: false, volume: value });
  }

  async savePosition() {
    const { playing } = this.props.playQueue;
    const pos = playing.fetchedPlayPosition || {};

    pos._type = 'play-position';
    pos.position = this.state.progress;
    pos.watched = this.state.progress > playing.fileduration * 0.97;
    const posResult = await store.dispatch(apiActions.write(pos));

    if (!this.pos.id) {
      playing._type = 'media-items';
      playing.playPosition = () => {
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
    this.setState({ navClass: ChromeCast.isActive() ? 'visible' : 'hidden' });
  }

  dialogClick(fromPos) {
    this.setState({ seek: fromPos, skippedDialog: true });
  }

  collapse() {
    this.setState({ collapsed: 'collapsed' });
  }

  restore() {
    this.setState({ collapsed: '' });
  }

  render() {
    const { playing } = this.props.playQueue;
    if (!playing) return null;


    let renderer = ChromeCast.isActive() || this.state.casting
      ? ChromeCastRenderer
      : Html5VideoRenderer;
    if (LocalStorage.isAvailable(playing)) renderer = OfflineVideoRenderer;

    const position = playing.fetchedPlayPosition;
    if (playing && !this.state.skippedDialog && position) {
      return (
        <div className="video">
          <div className="movie-detail-backdrop-wrapper">
            <div
              className="movie-detail-backdrop"
              style={{ backgroundImage: `url(/img/${playing.id}_backdrop.jpg)` }}
            />
            <div
              className="movie-detail-backdrop poster"
              style={{ backgroundImage: `url(/img/${playing.id}_posterlarge.jpg)` }}
            />
          </div>
          <Modal
            style={{ display: 'block' }}
            id="continueWatching"
            actions={[
              <Button onClick={() => { this.dialogClick(0); }} modal="close">
                Start from beginning
              </Button>,
              <Button onClick={() => { this.dialogClick(position.position); }} modal="confirm">
                Continue watching
              </Button>,
            ]}
          >
            <h4>Continue watching?</h4>
            <Row>
              You watched untill <b>{Math.ceil(position.position / 60)}m</b>, continue watching?
            </Row>
          </Modal>
        </div>
      );
    }

    return (
      <div
        className={`video ${this.state.collapsed || ''} ${this.state.navClass}`}
        ref={(input) => { this.pageRef = input; }}
        onMouseMove={isTouch ? null : this.onMouseMove}
      >
        {/* <BodyClassName className="hideNav" /> */}

        <div
          className="wrapper"
          onClick={isTouch ? null : this.togglePause}
          onTouchStart={this.onTouch}
          onDoubleClick={this.toggleFullScreen}
        >
          <renderer
            mediaItem={playing}
            onProgress={this.onProgress}
            onStart={this.onStart}
            seek={this.state.seek}
            audioChannel={this.state.audio}
            videoChannel={this.state.video}
            subtitle={this.state.subtitle}
            volume={this.state.volume}
            paused={this.state.paused}
            subtitles={this.state.mediaContent !== undefined ? this.state.mediaContent.subtitles : []}
            onVolumeChange={this.volumeChange}
          />
        </div>
        <CastButton />
        <span id="collapseVideo" onClick={this.collapse}>
          <Icon>keyboard_arrow_down</Icon>
        </span>
        <h1>
          <span id="closeVideo" onClick={this.close}>
            <Icon>close</Icon>
          </span>
          <span id="restoreVideo" onClick={this.restore}>
            <Icon>keyboard_arrow_up</Icon>
          </span>
          {playing.title}
        </h1>

        {this.loadingOrPaused()}
        {this.state.infoText ? <div className="infoText">{this.state.infoText}</div> : ''}
        <NavBar
          onSelectContent={this.onSelectContent}
          mediaContent={this.state.mediaContent}
          item={playing}
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

export default connect(({ playQueue }) => ({ playQueue }), playQueueActions)(Video);
