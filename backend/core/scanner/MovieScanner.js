const Settings = require('../Settings');
const Database = require('../database/Database');
const MediaItemHelper = require('../MediaItemHelper');
const fs = require('fs');
const { spawn } = require('child_process');
const Log = require('../Log');
const extendedInfoQueue = require('./ExtendedInfoQueue');
const core = require('../');

const onFileFoundCallbacks = [];

class MovieScanner {
  start() {
    core.addAfterStartListener(() => {
      const debug = core.getModule('debug');
      if (!debug) return;
      debug.registerDebugInfoProvider('scanner', this.debugInfo.bind(this));
    });
    this.library = null;
    this.scanning = -1;
    this.types = Settings.getValue('videoFileTypes');
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
      { stdio: ['ipc'] },
    );
    proc.on('error', (err) => {
      Log.debug(err);
    });
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
        MovieScanner.addFileToDatabase(library, file, stat);
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
    MovieScanner.checkForMediaItemsWithMissingLibrary();
    MovieScanner.checkForMediaItemsWithMissingFiles();
    this.scanNext();
  }

  static checkForMediaItemsWithMissingFiles() {
    const libs = {};
    MovieScanner.getLibraries().forEach((l) => { libs[l.uuid] = l; });

    const items = Database.getAll('media-item', true);
    function next() {
      if (!items.length) {
        return;
      }
      const file = MediaItemHelper.getFullFilePath(items[0]);
      fs.stat(file, (err, stat) => {
        if (err) {
          Log.info('item missing, removing', file, items[0].id);
          Database.deleteObject('media-item', items[0].id);
        } else {
          // will reprocess (only if filesize has changed.)
          MovieScanner.addFileToDatabase(libs[items[0].attributes.libraryId], file, stat);
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
            MovieScanner.addFileToDatabase(this.library, file);
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

  static addFileToDatabase(library, file, stat = null) {
    file = MovieScanner.normalizeFileName(library.folder, file);
    let [item] = Database.findBy('media-item', 'filepath', file);
    if (!item) {
      Log.notifyUser('toast', 'found new file', file);
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
      item = Database.setObject('media-item', obj);
      extendedInfoQueue.push(item);
      onFileFoundCallbacks.forEach(cb => cb(item));
    } else if (stat && stat.size !== item.attributes.filesize) {
      item.attributes = {
        ...item.attributes,
        filesize: stat.size,
        shared: false,
        chunks: [],
        shareparts: 0,
        gotfileinfo: 0,
      };
      Database.update('media-item', item);
      extendedInfoQueue.push(item);
    }
  }

  static normalizeFileName(lib, file) {
    file = file.substr(lib.length);
    file = file.replace('\\', '/').replace('//', '/');
    return lib.replace(/^(.*?)(\\|\/)?$/, '$1') + file;
  }

  static setOnFileFound(cb) {
    onFileFoundCallbacks.push(cb);
  }

  debugInfo() {
    return { currentLibrary: this.library, scanning: this.scanning };
  }
}

const scanner = new MovieScanner();
core.addAfterStartListener(scanner.start.bind(scanner));

// MovieScanner is a singleton!
module.exports = scanner;
