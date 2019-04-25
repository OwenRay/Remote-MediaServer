/* global navigator,localStorage,window */

const eventListeners = { [-1]: [] };
const { webkitPersistentStorage } = navigator;
const { webkitRequestFileSystem, PERSISTENT } = window;
const localStorageData = JSON.parse(localStorage.getItem('offline') || '{}');

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

  static async downloadAndWriteTo(item, ref) {
    // const blob = new Blob(['Lorem Ipsum'], { type: 'text/plain' });
    const myRequest = new Request(`/ply/${item.id}/0`);
    const response = await fetch(myRequest);
    const reader = response.body.getReader();
    const estimatedSize = (item.bitrate / 8) * item.fileduration;
    item.bytesDownloaded = 0;
    console.log(item);

    const readmore = async () => {
      const data = await reader.read();
      if (data.done) {
        item.downloaded = true;
        item.localSize = ref.position - 1;
        LocalStorage.save();
        LocalStorage.trigger(item.id, 'onFinish');
        return;
      }

      const arr = new Uint8Array(data.value);
      item.bytesDownloaded += data.value.length;
      LocalStorage.trigger(item.id, 'onProgress', [item.bytesDownloaded / estimatedSize]);
      ref.write(new Blob([arr]));
    };
    ref.onwrite = readmore;
    readmore();
  }

  static save() {
    localStorage.setItem('offline', JSON.stringify(localStorageData));
  }

  static download(item, audioChannel, videoChannel) {
    webkitRequestFileSystem(PERSISTENT, item.filesize, (storage) => {
      storage.root.getFile(
        `${item.id}.mp4`,
        { create: true },
        (file) => {
          item.path = file.toURL();
          localStorageData[item.id] = item;
          LocalStorage.save();
          file.createWriter((ref) => {
            LocalStorage.downloadAndWriteTo(item, ref);
          });
        },
      );
    });
  }

  static getVideoUri({ id }) {
    return localStorageData[id].path;
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
}

LocalStorage.isSupported = webkitPersistentStorage;


export default LocalStorage;
