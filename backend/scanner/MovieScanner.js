const Settings = require('../Settings');
const Database = require('../Database');
const MediaItemHelper = require('../helpers/MediaItemHelper');
const fs = require('fs');
const watchr = require('watchr');
const Log = require('../helpers/Log');
const extendedInfoQueue = require('./ExtendedInfoQueue').getInstance();

class MovieScanner {
  constructor() {
    this.library = null;
    this.scanning = -1;
    this.types = Settings.getValue('videoFileTypes');
    this.startWatchingAll();
    Settings.addObserver('libraries', this.onLibrariesChange.bind(this));
  }

  onLibrariesChange() {
    this.watchers.forEach(watcher => watcher.close());
    this.startWatchingAll();
    this.scan();
  }

  startWatchingAll() {
    this.watchers = Settings.getValue('libraries').map(this.startWatching.bind(this));
  }

  startWatching(lib) {
    return watchr.open(
      lib.folder,
      (type, file) => {
        this.onWatch(file, lib);
      },
      (err) => {
        if (err) Log.debug('watch failed on', lib, 'with error', err);
        else Log.debug('watch successful on', lib);
      },
    );
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
        MovieScanner.addFileToDatabase(library, file);
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
    MovieScanner.checkForMediaItemsWithMissingFiles();
    MovieScanner.checkForMediaItemsWithMissingLibrary();
    this.scanNext();
  }

  static checkForMediaItemsWithMissingFiles() {
    const items = Database.getAll('media-item');
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
    const libraries = Settings.getValue('libraries');
    const libIds = libraries.map(l => l.uuid);

    const items = Database.getAll('media-item');
    Object.keys(items).forEach((key) => {
      const item = items[key];
      if (libIds.indexOf(item.attributes.libraryId) === -1) {
        Database.deleteObject('media-item', item.id);
      }
    });
  }

  async scanNext() {
    this.scanning += 1;
    if (this.scanning >= Settings.getValue('libraries').length) {
      this.scanning = -1;
      if (this.scanRequested) {
        this.scan();
      }
      return;
    }

    this.library = Settings.getValue('libraries')[this.scanning];
    Log.info('start scan', this.library);

    await this.getFilesFromDir(`${this.library.folder}/`);
    this.scanNext();
  }

  getFilesFromDir(dir) {
    return new Promise((resolve) => {
      fs.readdir(dir, (err, files) => {
        if (err) {
          Log.warning('error dir listing', err);
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

  static addFileToDatabase(library, file) {
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
      extendedInfoQueue.push(Database.setObject('media-item', obj));
    }
  }

  static normalizeFileName(lib, file) {
    file = file.substr(lib.length);
    file = file.replace('\\', '/').replace('//', '/');
    return lib.replace(/^(.*?)(\\|\/)?$/, '$1') + file;
  }
}

// MovieScanner is a singleton!
module.exports = new MovieScanner();
