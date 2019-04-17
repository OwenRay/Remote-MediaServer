/* global navigator,localStorage,window */

const listeners = [];
const { webkitPersistentStorage } = navigator;
const { webkitRequestFileSystem, PERSISTENT } = window;
const localStorageData = JSON.parse(localStorage.getItem('offline') || '{}');

function offChangeListener() {
  listeners.splice(this, 1);
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
            used: Math.floor(usedBytes / Math.pow(10, 9)),
            granted: Math.ceil(grantedBytes / Math.pow(10, 9)),
          });
        },
        reject,
      );
    });
  }

  static setOnChangeListener(func) {
    listeners.push(func);
    return offChangeListener.bind(listeners.length - 1);
  }

  static async downloadAndWriteTo(item, ref) {
    // const blob = new Blob(['Lorem Ipsum'], { type: 'text/plain' });
    let myRequest = new Request(`/ply/${item.id}/0`);
    const response = await fetch(myRequest);
    const reader = response.body.getReader();

    const readmore = async () => {
      const data = await reader.read();
      if (data.done) {
        console.log('done');
        return;
      }
      ref.write(new Blob([new Uint8Array(data.value)]));
    };
    ref.onwrite = readmore;
    readmore();
  }

  static download(item, audioChannel, videoChannel) {
    webkitRequestFileSystem(PERSISTENT, item.filesize, (storage) => {
      storage.root.getFile(
        `${item.id}.mp4`,
        { create: true },
        (file) => {
          item.path = file.toURL();
          localStorageData[item.id] = item;
          localStorage.setItem('offline', JSON.stringify(localStorageData));
          file.createWriter((ref) => {
            LocalStorage.downloadAndWriteTo(item, ref);
          });
        },
      );
    });
  }

  static getVideoUri({id}) {
    return localStorageData[id].path;
  }

  static isAvailable(id) {
    return this.isSupported && localStorageData[id];
  }
}

LocalStorage.isSupported = webkitPersistentStorage;


export default LocalStorage;
