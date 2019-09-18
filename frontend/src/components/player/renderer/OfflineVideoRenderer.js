import Hls from 'hls.js';
import Html5VideoRenderer from './Html5VideoRenderer';
import LocalStorage from '../../../helpers/LocalStorage';

class OfflineVideoRenderer extends Html5VideoRenderer {
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

    // reload the video when it changes
    if (this.props.mediaItem && this.props.mediaItem.id !== nextProps.mediaItem.id && this.vidRef) {
      this.hls = null;
      this.gotVidRef(this.vidRef);
    }
    return false;
  }

  setOffset(offset) {
    this.vidRef.currentTime = offset;
  }
}

export default OfflineVideoRenderer;
