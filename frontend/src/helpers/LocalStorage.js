/* global navigator,localStorage,window */
import OfflineMediaSource from '../components/localStorage/OfflineMediaSource';

const eventListeners = { [-1]: [] };
const { webkitPersistentStorage } = navigator;
const { webkitRequestFileSystem, PERSISTENT } = window;
const localStorageData = JSON.parse(localStorage.getItem('offline') || '{}');
const CHUNKSIZE = 10 * Math.pow(10, 6);

function offChangeListener() {
  eventListeners[this[0]].splice(this[1], 1);
}

class LocalStorage {
  static requestStorage(gigaBytes) {
    return new Promise((resolve, reject) => {
      webkitPersistentStorage.requestQuota(
        gigaBytes * Math.pow(10, 9),
        resolve,
        reject,
      );
    });
  }

  static getCurrentQuota() {
    return new Promise((resolve, reject) => {
      webkitPersistentStorage.queryUsageAndQuota(
        (usedBytes, grantedBytes) => {
          resolve({
            used: usedBytes / Math.pow(10, 9),
            granted: grantedBytes / Math.pow(10, 9),
          });
        },
        reject,
      );
    });
  }

  static async downloadAndWriteTo(item) {
    const myRequest = new Request(`/ply/${item.id}/0`);
    const response = await fetch(myRequest);
    const reader = response.body.getReader();
    const estimatedSize = (item.bitrate / 8) * item.fileduration;
    item.bytesDownloaded = 0;
    item.bytesTotal = estimatedSize;
    LocalStorage.save();

    LocalStorage.readNextChunk(
      item.id,
      reader,
      (chunk, bytes) => {
        item.bytesDownloaded = bytes;
        LocalStorage.trigger(item.id, 'onProgress', [bytes / estimatedSize]);
      },
      () => {
        item.downloaded = true;
        item.bytesTotal = item.bytesDownloaded;
        LocalStorage.save();
        LocalStorage.trigger(item.id, 'onFinish');
      },
    );
  }


  static getFile(file, create) {
    return new Promise((resolve) => {
      webkitRequestFileSystem(PERSISTENT, CHUNKSIZE, (storage) => {
        storage.root.getFile(
          file, { create },
          (f) => {
            resolve(f);
          },
        );
      });
    });
  }

  static getFileRef(file, create = true) {
    return new Promise(async (resolve) => {
      const f = await LocalStorage.getFile(file, create);
      f.createWriter(resolve);
    });
  }

  static async readNextChunk(itemId, reader, onProgress, onFinish, chunk = 0, offset = 0, carry = null) {
    let done = false;
    const ref = await LocalStorage.getFileRef(`${itemId}_${chunk}.mp4`);
    let bytesInChunk = 0;
    let nextCarry;
    const readmore = async () => {
      if (done) {
        onFinish();
        return;
      }
      if (bytesInChunk >= CHUNKSIZE) {
        this.readNextChunk(itemId, reader, onProgress, onFinish, chunk + 1, offset, nextCarry);
        return;
      }

      const buffer = [];
      for (let c = 0; c < 20 && bytesInChunk < CHUNKSIZE; c++) {
        const data = carry || await reader.read();
        carry = null;
        if (data.done) {
          done = true;
          break;
        }
        bytesInChunk += data.value.length;
        if (bytesInChunk > CHUNKSIZE) {
          nextCarry = {value: data.value.slice(-bytesInChunk + CHUNKSIZE)};
          data.value = data.value.slice(0, -bytesInChunk + CHUNKSIZE);
          bytesInChunk = CHUNKSIZE;
        }
        offset += data.value.length;
        buffer.push(data.value);
      }

      if (!buffer.length) {
        readmore();
        return;
      }
      onProgress(chunk, offset);

      ref.write(new Blob(buffer));
    };

    ref.onwrite = readmore;
    readmore();
  }

  static save() {
    localStorage.setItem('offline', JSON.stringify(localStorageData));
  }

  static download(item, audioChannel, videoChannel) {
    webkitRequestFileSystem(PERSISTENT, item.filesize, () => {
      localStorageData[item.id] = item;
      LocalStorage.save();
      LocalStorage.downloadAndWriteTo(item);
    });
  }

  static isAvailable(id) {
    return this.isSupported && localStorageData[id];
  }

  static trigger(id, event, args = []) {
    eventListeners[id]
      .slice()
      .concat(eventListeners[-1])
      .filter(e => e[event])
      .forEach(e => e[event](...args));
  }

  static addListener(id, onProgress, onFinish) {
    if (!eventListeners[id]) eventListeners[id] = [];
    eventListeners[id].push({ onProgress, onFinish });
    return offChangeListener.bind([id, eventListeners[id].length - 1]);
  }

  static getMediaSource({ id }) {
    return new OfflineMediaSource(localStorageData[id]);
  }
}

LocalStorage.isSupported = webkitPersistentStorage;
LocalStorage.CHUNKSIZE = CHUNKSIZE;

export default LocalStorage;
