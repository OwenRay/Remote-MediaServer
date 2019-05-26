/* global navigator,localStorage,window */
import HLSDownloader from '../components/localStorage/HLSDownloader';

const eventListeners = { [-1]: [] };
const { webkitPersistentStorage } = navigator;
const { fetch, webkitRequestFileSystem, PERSISTENT } = window;
const localStorageData = JSON.parse(localStorage.getItem('offline') || '{}');
const downloading = {};

function offChangeListener() {
  eventListeners[this[0]].splice(this[1], 1);
}

class LocalStorage {
  static requestStorage(gigaBytes) {
    return new Promise((resolve, reject) => {
      webkitPersistentStorage.requestQuota(
        gigaBytes * (1024 ** 3),
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
            used: Math.round((usedBytes / (1024 ** 3)) * 100) / 100,
            granted: Math.round((grantedBytes / (1024 ** 3)) * 100) / 100,
          });
        },
        reject,
      );
    });
  }

  static save() {
    localStorage.setItem('offline', JSON.stringify(localStorageData));
  }

  static checkQuota(size) {
    return new Promise((resolve, reject) => {
      webkitPersistentStorage.queryUsageAndQuota(
        (usedBytes, grantedBytes) => {
          resolve(grantedBytes - usedBytes > size);
        },
        reject,
      );
    });
  }

  /**
   * @todo fetch subtitles
   * @todo fetch video with specific audio/video channel
   */
  static async download(item, audioChannel, videoChannel) {
    const estimatedSize = (item.bitrate / 8) * item.fileduration;
    if (!await this.checkQuota(estimatedSize)) return false;

    // make sure the necessary assets are cache
    [
      `/api/media-items/${item.id}`,
      `/img/${item.id}_poster.jpg`,
      `/img/${item.id}_backdrop.jpg`,
      `/img/${item.id}_posterlarge.jpg`,
      `/api/mediacontent/${item.id}`,
    ].forEach((url) => {
      fetch(url);
    });

    // start download of the HLS
    const downloader = new HLSDownloader(`hls_${item.id}`, `/ply/${item.id}/0?format=hls&nothrottle=true`);
    downloading[item.id] = downloader;
    downloader.setOnProgress(progress => this.trigger(
      item.id,
      'onProgress',
      [progress / estimatedSize],
    ));
    downloader.setOnComplete(() => {
      downloading[item.id] = null;
      this.trigger(item.id, 'onFinish');
    });
    downloader.start();

    localStorageData[item.id] = item;
    this.trigger(item.id, 'onStart');
    item.localUrl = await downloader.getLocalUrl();
    LocalStorage.save();
    return true;
  }

  static async delete({ id }) {
    if (downloading[id]) {
      downloading[id].cancel();
    }

    return new Promise((resolve) => {
      webkitRequestFileSystem(PERSISTENT, 0, (storage) => {
        storage.root.getDirectory(`hls_${id}`, {
          create: true,
          exclusive: false,
        }, (dir) => {
          delete localStorageData[id];
          dir.removeRecursively(resolve);
          LocalStorage.save();
          this.trigger(id, 'onDelete');
        });
      });
    });
  }

  static isAvailable({ id }) {
    return LocalStorage.isSupported
      && localStorageData[id];
  }

  static trigger(id, event, args = []) {
    eventListeners[id]
      .slice()
      .concat(eventListeners[-1])
      .filter(e => e[event])
      .forEach(e => e[event](...args));
  }

  static addListener(id, onProgress, onFinish, onStart, onDelete) {
    if (!eventListeners[id]) eventListeners[id] = [];
    eventListeners[id].push({
      onProgress, onFinish, onStart, onDelete,
    });
    return offChangeListener.bind([id, eventListeners[id].length - 1]);
  }

  static getMediaUrl({ id }) {
    return localStorageData[id].localUrl;
  }

  static getItems() {
    return Object.values(localStorageData);
  }
}

LocalStorage.isSupported = webkitPersistentStorage && window.chrome;

export default LocalStorage;
