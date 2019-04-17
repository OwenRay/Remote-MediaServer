import Html5VideoRenderer from './Html5VideoRenderer';
import LocalStorage from '../../../helpers/LocalStorage';

class OfflineVideoRenderer extends Html5VideoRenderer {
  getVideoUrl() {
    if (!this.props.mediaItem) return '';
    return LocalStorage.getVideoUri(this.props.mediaItem);
  }

  onProgress() {
    if (this.vidRef.readyState === 0) {
      return;
    }
    this.setState({ progress: this.vidRef.currentTime });
    this.props.onProgress(this.state.progress);
  }

  gotVidRef(vidRef) {
    if (this.props.seek) {
      vidRef.currentTime = this.props.seek;
    }
    return super.gotVidRef(vidRef);
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.seek !== nextProps.seek && this.vidRef) {
      this.vidRef.currentTime = nextProps.seek;
    }
    return false;
  }
}

export default OfflineVideoRenderer;
