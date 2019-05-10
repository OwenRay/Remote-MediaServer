import LocalStorage from '../../helpers/LocalStorage';

class OfflineMediaSource extends MediaSource {
  constructor(item) {
    super();
    this.item = item;
    this.offset = 0;
    this.next = this.next.bind(this);
    this.onSourceOpen = this.onSourceOpen.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.addEventListener('sourceopen', this.onSourceOpen);
  }

  getUrl() {
    return URL.createObjectURL(this);
  }

  setVideoTag(videoTag) {
    this.videoTag = videoTag;
    videoTag.addEventListener('destroy', console.log);
  }

  async onSourceOpen() {
    this.duration = this.item.fileduration;
    this.sourceBuffer = this.addSourceBuffer('video/mp4; codecs="avc1.640028, mp4a.40.2"');
    this.sourceBuffer.addEventListener('updateend', this.next);
    this.next();
  }

  onSeek(offset) {
    /** @todo implement proper seeking */
  }

  async next() {
    if (this.appending) return;
    //console.log('next');

    this.appending = true;
    const {offset} = this;
    const data = await this.fetchChunk(offset);

    const append = () => {
      try {
        if(this.offset!==offset) return;
        this.clearFirst = false;
        this.sourceBuffer.appendBuffer(data);
        this.offset++;
        this.appending = false;
      } catch (e) {
        //console.log(e);
      }
      this.nextTimeout = setTimeout(append, 100);
    };

    append();
  }


  fetchChunk(offset) {
    return new Promise(async (resolve, reject) => {
      const file = await LocalStorage.getFile(`${this.item.id}_${offset}.mp4`, false);
      const url = file.toURL();
      const oReq = new XMLHttpRequest();
      oReq.open('GET', url);
      oReq.responseType = 'arraybuffer';

      oReq.onload = function (oEvent) {
        resolve(oReq.response);
      };
      oReq.send();
    });
  }
}

export default OfflineMediaSource;
