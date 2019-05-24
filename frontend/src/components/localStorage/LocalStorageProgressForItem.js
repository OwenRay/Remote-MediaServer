/* global window */
import 'react-circular-progressbar/dist/styles.css';
import { ProgressBar } from 'react-materialize';
import React, { Component } from 'react';
import { throttle } from 'throttle-debounce';
import LocalStorage from '../../helpers/LocalStorage';

class LocalStorageProgressForItem extends Component {
  constructor(props) {
    super(props);
    this.state = { progress: 0 };
    this.onFinish = this.onFinish.bind(this);
    this.onProgress = throttle(300, this.onProgress.bind(this));
    this.componentWillReceiveProps();
  }

  componentWillReceiveProps() {
    if (this.off || !this.props.item) return;
    this.off = LocalStorage.addListener(this.props.item.id, this.onProgress, this.onFinish);
  }

  componentWillUnmount() {
    if (this.off) this.off();
    this.onProgress.cancel();
  }

  onProgress(progress) {
    this.setState({ progress: progress * 100 });
  }

  onFinish() {
    setTimeout(() => {
      this.setState({ progress: 0 });
    }, 350);
  }

  render() {
    const { progress } = this.state;
    if (!progress) return null;
    return <ProgressBar className="localStorageProgress" progress={progress} />;
  }
}

export default LocalStorageProgressForItem;
