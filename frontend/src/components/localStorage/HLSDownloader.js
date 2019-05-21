
const { webkitRequestFileSystem, PERSISTENT } = window;
const CHUNKSIZE = 10 * (10 ** 6);

export default class HLSDownloader {
  constructor(localDir, url) {
    this.session = Math.random();
    this.url = `${url}&session=${this.session}`;
    this.localDir = localDir;
    this.chunks = [];
    this.offset = 0;
    this.currentSize = 0;
  }

  start() {
    webkitRequestFileSystem(PERSISTENT, CHUNKSIZE, (storage) => {
      storage.root.getDirectory(`${this.localDir}`, { create: true, exclusive: false }, () => {
        this.downloadNextChunk();
      });
    });
  }

  async downloadNextChunk() {
    if (this.cancelled) return;

    if (this.chunks.length <= this.offset) await this.refreshPlaylist();
    if (this.chunks.length <= this.offset) {
      if (this.playlistComplete) return this.onComplete();
      return setTimeout(this.downloadNextChunk.bind(this), 1000);
    }
    const { url } = this.chunks[this.offset];
    const [, segment] = url.split('segment=');

    const file = await this.getFileRef(segment || url);
    console.log('download chunk', url);
    const req = await fetch(url);
    this.req = req;
    const reader = req.body.getReader('');
    let data;


    do {
      const buffer = [];
      for (let c = 0; c < 20; c++) {
        data = await reader.read();
        if (data.done) {
          break;
        }
        this.currentSize += data.value.length;
        buffer.push(data.value);
      }
      if (this.cancelled) return;

      this.onProgress(this.currentSize);

      if (buffer.length) {
        await new Promise((resolve) => {
          file.onwrite = resolve;
          file.write(new Blob(buffer));
        });
      }
      // onProgress(chunk, size);
    } while (!data.done);
    this.offset += 1;
    this.downloadNextChunk();
    this.writePlaylist();
  }

  async writePlaylist() {
    if (this.writingPlaylist) return;
    this.writingPlaylist = true;

    const list = this.chunks.reduce((red, { url, duration }) => {
      const [, segment] = url.split('segment=');
      return `${red}\n#EXTINF:${duration},\n${segment || url}`;
    }, '');
    const filedata = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:11
#EXT-X-START:TIME-OFFSET=0
#EXT-X-MEDIA-SEQUENCE:0
${list}`;
    const m3u8 = new Blob([filedata], { type: 'text/plain' });
    const writer = await this.getFileRef('vid.m3u8');
    let writing = -1;
    const func = () => {
      writing += 1;
      switch (writing) {
        case 0: writer.truncate(0);
          break;
        case 1: writer.write(m3u8);
          break;
        default: this.writingPlaylist = false;
          break;
      }
    };
    writer.onwriteend = func;
    func();
  }

  async refreshPlaylist() {
    if (this.playlistComplete) return;
    console.log('refresh list', this.url);
    const response = await fetch(this.url);

    let nextDuration = 0;
    const hls = (await response.text())
      .split('\n')
      .map((line) => {
        if (line.indexOf('#EXTINF') === 0) {
          nextDuration = Number.parseFloat(line.split(':')[1]);
          return false;
        }
        if (line.indexOf('#EXT-X-ENDLIST') === 0) {
          this.playlistComplete = true;
        }
        if (line[0] === '#') return false;

        if (nextDuration) {
          const ret = { url: line, duration: nextDuration };
          nextDuration = 0;
          return ret;
        }
        return false;
      })
      .filter(line => line);
    this.chunks = hls;
  }


  getFileRef(file, create = true) {
    return new Promise(async (resolve) => {
      const f = await this.getFile(file, create);
      f.createWriter(resolve);
    });
  }


  getFile(file, create) {
    return new Promise((resolve) => {
      webkitRequestFileSystem(PERSISTENT, CHUNKSIZE, (storage) => {
        storage.root.getFile(
          `${this.localDir}/${file}`,
          { create },
          (f) => {
            resolve(f);
          },
        );
      });
    });
  }

  getLocalUrl() {
    return new Promise(async (resolve) => {
      const file = await this.getFile('vid.m3u8', true);
      resolve(file.toURL());
    });
  }

  cancel() {
    this.cancelled = true;
    this.onComplete();
  }

  setOnProgress(onProgress) {
    this.onProgress = onProgress;
  }

  setOnComplete(onComplete) {
    this.onComplete = onComplete;
  }
}
