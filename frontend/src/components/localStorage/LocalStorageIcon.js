/* global window */
import 'react-circular-progressbar/dist/styles.css';
import CircularProgressbar from 'react-circular-progressbar';
import React, { Component } from 'react';
import LocalStorage from '../../helpers/LocalStorage';

class LocalStorageIcon extends Component {
  constructor() {
    super();
    this.state = { useRatio: 0 };
  }

  componentWillMount() {
    this.refresh();
  }

  async refresh() {
    const quota = await LocalStorage.getCurrentQuota();
    const useRatio = Math.round((quota.used / quota.granted) * 100) || 0;
    this.setState({ useRatio });
  }

  render() {
    return (
      <CircularProgressbar
        className="localStorageIcon"
        percentage={this.state.useRatio}
        strokeWidth={10}
        background
        backgroundPadding={0}
        text={`${this.state.useRatio}%`}
        styles={{
          background: {
            fill: 'white',
          },
          path: { stroke: 'white' },
          trail: { stroke: '#0a0c1a' },
          text: { fill: '#0a0c1a', fontSize: '30px', fontWeight: 'bold' },
        }}
      />
    );
  }
}

export default LocalStorageIcon;
