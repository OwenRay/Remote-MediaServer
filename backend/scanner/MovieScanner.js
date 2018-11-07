const Settings = require('../Settings');
const Database = require('../Database');
const MediaItemHelper = require('../helpers/MediaItemHelper');
const fs = require('fs');
const { spawn } = require('child_process');
const Log = require('../helpers/Log');
const DebugApiHandler = require('../requestHandlers/api/DebugApiHandler');
const extendedInfoQueue = require('./ExtendedInfoQueue').getInstance();

// @todo skip ipfs scanning
class MovieScanner {
  constructor() {
    DebugApiHandler.registerDebugInfoProvider('scanner', this.debugInfo.bind(this));
    this.library = null;
    this.scanning = -1;
    this.types = Settings.getValue('videoFileTypes');
    this.onFileFoundCallbacks = [];
    this.startWatchingAll();
    if (Settings.getValue('startscan')) this.scan();
    Settings.addObserver('libraries', this.onLibrariesChange.bind(this));
    Settings.addObserver('filewatcher', this.startWatchingAll.bind(this));
  }

  onLibrariesChange() {
    this.startWatchingAll();
    this.scan();
  }

  static getLibraries() {
    return Settings.getValue('libraries')
      .filter(lib => lib.type !== 'shared');
  }

  startWatchingAll() {
    if (this.watchers) {
      this.watchers.forEach(watcher => watcher.kill());
    }
    this.watchers = MovieScanner.getLibraries()
      .map(this.startWatching.bind(this));
  }

  startWatching(lib) {
    const proc = spawn(
      'node',
      [`${__dirname}/FilewatchWorker.js`, lib.folder, Settings.getValue('filewatcher')],
      { stdio: [0, 1, 'ipc'] },
    );
    proc.on('message', (file) => {
      this.onWatch(file, lib);
    });
    return proc;
  }

  onWatch(file, library) {
    file = MovieScanner.normalizeFileName(library.folder, `${file}`);
    const [item] = Database.findBy('media-item', 'filepath', file);

    fs.stat(file, (err, stat) => {
      if (err) {
        if (err.code === 'ENOENT' && item) {
          Database.deleteObject('media-item', item.id);
        }
        return;
      }
      if (this.willInclude(file, stat)) {
        this.addFileToDatabase(library, file);
      }
    });
  }

  scan() {
    if (this.scanning !== -1) {
      Log.info('Scan in progress');
      this.scanRequested = true;
      return;
    }
    this.scanRequested = false;
    Log.info('start scanner');
    // check all files for possible extra info.
    MovieScanner.checkForMediaItemsWithMissingFiles();
    MovieScanner.checkForMediaItemsWithMissingLibrary();
    this.scanNext();
  }

  static checkForMediaItemsWithMissingFiles() {
    const items = Database.getAll('media-item', true);
    function next() {
      if (!items.length) {
        return;
      }
      fs.stat(MediaItemHelper.getFullFilePath(items[0]), (err) => {
        if (err) {
          Log.info('item missing, removing', MediaItemHelper.getFullFilePath(items[0]), items[0].id);
          Database.deleteObject('media-item', items[0].id);
        }
        items.shift();
        next();
      });
    }
    next();
  }

  static checkForMediaItemsWithMissingLibrary() {
    const libIds = MovieScanner.getLibraries().map(l => l.uuid);

    const items = Database.getAll('media-item', true);
    Object.keys(items).forEach((key) => {
      const item = items[key];
      if (libIds.indexOf(item.attributes.libraryId) === -1) {
        Database.deleteObject('media-item', item.id);
      }
    });
  }

  async scanNext() {
    this.scanning += 1;
    if (this.scanning >= MovieScanner.getLibraries().length) {
      this.scanning = -1;
      if (this.scanRequested) {
        this.scan();
      }
      return;
    }

    this.library = MovieScanner.getLibraries()[this.scanning];
    Log.info('start scan', this.library);

    try {
      await this.getFilesFromDir(`${this.library.folder}/`);
    } catch (e) {
      Log.warning('error scanning', e);
    }
    this.scanNext();
  }

  getFilesFromDir(dir) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        this.procesFiles(dir, files).then(resolve);
      });
    });
  }

  procesFiles(dir, files) {
    return new Promise((resolve) => {
      const next = () => {
        if (!files.length) {
          resolve();
          return;
        }
        const file = dir + files.pop();
        fs.stat(file, (err, stats) => {
          if (err) {
            Log.warning(`err stating ${file}`);
            next();
            return;
          }
          if (stats.isDirectory()) {
            this.getFilesFromDir(`${file}/`).then(next);
            return;
          }
          if (this.willInclude(file, stats)) {
            this.addFileToDatabase(this.library, file);
          }
          next();
        });
      };
      next();
    });
  }

  willInclude(file, fileRef) {
    if (fileRef.isDirectory()) {
      return false;
    }
    const f = file.split('.');
    const type = f[f.length - 1];
    return this.types.some(i => i === type);
  }

  addFileToDatabase(library, file) {
    file = MovieScanner.normalizeFileName(library.folder, file);
    if (!Database.findBy('media-item', 'filepath', file).length) {
      Log.info('found new file', file);
      const obj = {
        filepath: file,
        libraryId: library.uuid,
        mediaType: library.type,
        date_added: new Date().getTime(),
      };
      if (file.match(/.*sample.*/)) {
        obj.sample = true;
        obj.extra = true;
      } else if (file.match(/.*trailer.*/)) {
        obj.extra = true;
      }
      const item = Database.setObject('media-item', obj);
      extendedInfoQueue.push(item);
      this.onFileFoundCallbacks.forEach(cb => cb(item));
    }
  }

  static normalizeFileName(lib, file) {
    file = file.substr(lib.length);
    file = file.replace('\\', '/').replace('//', '/');
    return lib.replace(/^(.*?)(\\|\/)?$/, '$1') + file;
  }

  setOnFileFound(cb) {
    this.onFileFoundCallbacks.push(cb);
  }

  debugInfo() {
    return { currentLibrary: this.library, scanning: this.scanning };
  }
}

// MovieScanner is a singleton!
module.exports = new MovieScanner();
