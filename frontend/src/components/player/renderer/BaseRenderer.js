/* eslint-disable react/no-unused-prop-types */
import { Component } from 'react';
import PropTypes from 'prop-types';

class BaseRenderer extends Component {
  componentDidMount() {
    this.componentWillReceiveProps(this.props);
  }

  getVideoUrl() {
    if (!this.props.mediaItem) return '';
    const params = [];
    if (this.props.audioChannel !== undefined) {
      params.push(`audioChannel=${this.props.audioChannel}`);
    }
    if (this.props.videoChannel !== undefined) {
      params.push(`videoChannel=${this.props.videoChannel}`);
    }
    return `/ply/${this.props.mediaItem.id}/${this.props.seek}?${params.join('&')}`;
  }
}


BaseRenderer.propTypes = {
  mediaItem: PropTypes.object.isRequired,
  onProgress: PropTypes.func.isRequired,
  seek: PropTypes.number,
  audioChannel: PropTypes.number,
  videoChannel: PropTypes.number,
  subtitle: PropTypes.string,
  volume: PropTypes.number,
  paused: PropTypes.bool,
  onVolumeChange: PropTypes.func.isRequired,
};

BaseRenderer.defaultProps = {
  seek: 0,
  volume: 1,
  paused: false,
  audioChannel: undefined,
  videoChannel: undefined,
  subtitle: null,
};

export default BaseRenderer;
