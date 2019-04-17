/* global window */
import 'react-circular-progressbar/dist/styles.css';
import CircularProgressbar from 'react-circular-progressbar';
import React, { Component } from 'react';
import LocalStorage from '../helpers/LocalStorage';

class LocalStorageIcon extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <CircularProgressbar
        className="localStorageIcon"
        percentage={10}
        strokeWidth={10}
        background
        backgroundPadding={0}
        text="10%"
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
