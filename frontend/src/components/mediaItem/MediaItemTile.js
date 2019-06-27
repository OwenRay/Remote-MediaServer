/**
 * Created by owenray on 19/07/2017.
 */

import React, { Component } from 'react';
import { Button, Icon } from 'react-materialize';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Flipped } from 'react-flip-toolkit';
import { connect } from 'react-redux';
import { playQueueActions } from '../../helpers/stores/playQueue';

class MediaItemTile extends Component {
  constructor() {
    super();
    this.play = this.play.bind(this);
  }

  componentWillMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.mediaItem) {
      return;
    }
    if (nextProps.mediaItem.index) {
      if (this.waitingForPromise) {
        return;
      }
      this.waitingForPromise = true;
      nextProps.requestData(nextProps.mediaItem.index)
        .then(this.gotData.bind(this));
      return;
    }
    this.waitingForPromise = true;
    this.gotData(nextProps.mediaItem);
  }

  componentWillUnmount() {
    this.waitingForPromise = false;
  }

  async gotData(data) {
    if (this.waitingForPromise) {
      this.waitingForPromise = false;
      if (data.playPosition) {
        data.playPos = (await data.playPosition()).position;
      }
      this.setState(data);
    }
  }

  playPos() {
    if (this.state.playPosition) {
      return (
        <div className="percent-played">
          <div style={{ width: `${(this.state.playPos / this.state.fileduration) * 100}%` }} />
        </div>
      );
    }
    return '';
  }

  play() {
    this.props.insertAtCurrentOffset(this.props.mediaItem);
  }

  render() {
    if (!this.state || !this.state.id) {
      return (
        <div style={this.props.style} className="grid-item loading">
          <Icon>movie</Icon>
        </div>
      );
    }

    let seasonEpisode;
    if (this.state.season) {
      let S = `${this.state.season}`;
      let E = `${this.state.episode}`;
      if (S.length < 2) S = `0${S}`;
      if (E.length < 2) E = `0${E}`;
      seasonEpisode = <span className="seasonEpisode">s{S}e{E}</span>;
    }

    if (!this.props.selected) this.intoView = false;

    return (
      <div
        style={this.props.style}
        className={`grid-item ${this.props.selected ? 'selected' : ''}`}
        ref={this.props.selected ? (ref) => {
          if (ref && !this.intoView) {
            this.intoView = true;
            ref.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        } : null}
      >
        <Flipped flipId={`media-item${this.props.mediaItem.id}`}>
          <div className="movie-detail-backdrop-wrapper">
            <div
              className="poster"
              data-poster-image={this.state.id}
              style={{ backgroundImage: `url(/img/${this.state.id}_postersmall.jpg)` }}
            />
          </div>
        </Flipped>
        <NavLink to={`/item/detail/${this.state.id}`} />
        <div className="detail">
          {this.playPos()}
          <Button
            floating
            className="play"
            icon="play_arrow"
            action="play"
            onClick={this.play}
          />
          <span className="title">{this.state.title}</span>
          <span className="year">{this.state.year}</span>
          {seasonEpisode}
        </div>
      </div>
    );
  }
}

MediaItemTile.propTypes = {
  mediaItem: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
  requestData: PropTypes.func,
  style: PropTypes.object,
};


MediaItemTile.defaultProps = {
  style: {},
  requestData: null,
};

export default connect(null, playQueueActions)(MediaItemTile);
