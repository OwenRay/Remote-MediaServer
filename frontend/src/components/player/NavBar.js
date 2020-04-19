import React, { Component } from 'react';
import { Button, Icon } from 'react-materialize';
import ButtonMenu from './ButtonMenu';
import { connect } from 'react-redux';
import { playQueueActions } from '../../helpers/stores/playQueue';

class NavBar extends Component {
  playPauseButton() {
    if (this.props.paused) {
      return <Button id="play-pause" floating large onClick={this.props.togglePause}><Icon>play_arrow</Icon></Button>;
    }
    return <Button id="play-pause" floating large onClick={this.props.togglePause} ><Icon>pause</Icon></Button>;
  }

  async componentWillReceiveProps(nextProps) {
    if (!this.state || !this.state.mediaContent) {
      this.setState({ mediaContent: nextProps.mediaContent });
    }
  }

  selected(type, item) {
    this.props.onSelectContent(type, item.value);
  }

  render() {
    const { playing, hasNext, hasPrev } = this.props.playQueue;
    const { onSelectContent } = this.props;
    const { mediaContent } = playing;
    if (!playing || !mediaContent) {
      return <div />;
    }

    return (
      <div className="controls">
        <img alt="poster" src={playing ? `/img/${playing.id}_poster.jpg` : ''} />
        <Button disabled={!hasPrev} id="prev" floating onClick={() => this.props.skip(-1)} ><Icon>skip_previous</Icon></Button>
        {this.playPauseButton()}
        <Button disabled={!hasNext} id="next" floating onClick={() => this.props.skip(1)} ><Icon>skip_next</Icon></Button>
        <div className="buttonsRight">
          <ButtonMenu onSelect={onSelectContent} type="audio" items={mediaContent.audio} />
          <ButtonMenu onSelect={onSelectContent} type="video" items={mediaContent.video} />
          <ButtonMenu onSelect={onSelectContent} type="subtitles" items={mediaContent.subtitles} />
          <Button id="fullscreen" floating onClick={this.props.toggleFullScreen}><Icon>fullscreen</Icon></Button>
        </div>
        {this.props.children}
      </div>
    );
  }
}

export default connect(({ playQueue }) => ({ playQueue }), playQueueActions)(NavBar);
