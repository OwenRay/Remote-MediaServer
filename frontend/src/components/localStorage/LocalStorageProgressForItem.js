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
    this.onProgressOriginal = this.onProgress.bind(this);
    this.componentWillReceiveProps(props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.item && nextProps.item.id === this.props.item.id) return;
    if (this.off) {
      this.off();
      this.onProgress.cancel();
      this.setState({ progress: 0 });
    }
    if (nextProps.item) {
      this.onProgress = throttle(300, this.onProgressOriginal);
      this.off = LocalStorage.addListener(nextProps.item.id, this.onProgress, this.onFinish);
    }
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
