import Hls from 'hls.js';
import Html5VideoRenderer from './Html5VideoRenderer';
import LocalStorage from '../../../helpers/LocalStorage';

class OfflineVideoRenderer extends Html5VideoRenderer {
  componentWillMount() {
  }

  componentWillUnmount() {
    if (this.hls) this.hls.destroy();
  }

  getVideoUrl() {
    return this.vidRef ? this.vidRef.src : '';
  }

  onProgress() {
    if (this.vidRef.readyState === 0) {
      return;
    }
    this.setState({ progress: this.vidRef.currentTime });
    this.props.onProgress(this.state.progress);
  }

  gotVidRef(vidRef) {
    if (!this.hls) {
      const hls = new Hls();
      this.hls = hls;
      hls.attachMedia(vidRef);
      hls.on(Hls.Events.MANIFEST_PARSED, () => vidRef.play());
      hls.loadSource(LocalStorage.getMediaUrl(this.props.mediaItem));
      if (this.props.seek) {
        vidRef.currentTime = this.props.seek;
      }
    }

    return super.gotVidRef(vidRef);
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.seek !== nextProps.seek && this.vidRef) {
      this.vidRef.currentTime = nextProps.seek;
    }
    return false;
  }

  setOffset(offset) {
    this.vidRef.currentTime = offset;
  }
}

export default OfflineVideoRenderer;
