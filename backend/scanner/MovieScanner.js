

const Settings = require('../Settings');
const Database = require('../Database');
const MediaItemHelper = require('../helpers/MediaItemHelper');
const fs = require('fs');
const Prom = require('node-promise').Promise;
const TheMovieDBExtendedInfo = require('./extendedInfo/TheMovieDBExtendedInfo');
const FFProbeExtendedInfo = require('./extendedInfo/FFProbeExtendedInfo');
const ParseFileNameExtendedInfo = require('./extendedInfo/ParseFileNameExtendedInfo');
const TheMovieDBSeriesAndSeasons = require('./extendedInfo/TheMovieDBSeriesAndSeasons');
const ExtrasExtendedInfo = require('./extendedInfo/ExtrasExtendedInfo');
const Log = require('../helpers/Log');

class MovieScanner {
  constructor() {
    this.library = null;
    this.scanning = -1;
    this.scan();
    Settings.addObserver('libraries', this.scan.bind(this));
  }

  setScanTimeout() {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
    }
    this.scanTimeout = setTimeout(this.scan.bind(this), Settings.getValue('scanInterval') * 1000);
  }

  scan() {
    if (this.scanning !== -1) {
      Log.info('Scan in progress');
      this.scanRequested = true;
      return;
    }
    this.scanRequested = false;
    Log.info('start scanner');
    this.setScanTimeout();
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

  scanNext() {
    this.scanning += 1;
    if (this.scanning >= Settings.getValue('libraries').length) {
      this.scanning = -1;
      if (this.scanRequested) {
        this.scan();
      }
      return;
    }

    this.types = Settings.getValue('videoFileTypes');
    this.library = Settings.getValue('libraries')[this.scanning];
    Log.info('start scan', this.library);

    this.getFilesFromDir(`${this.library.folder}/`)
      .then(this.checkForExtendedInfo.bind(this));
  }

  getFilesFromDir(dir) {
    const promise = new Prom();

    fs.readdir(dir, (err, files) => {
      if (err) {
        Log.warning('error dir listing', err);
        return;
      }
      this.procesFiles(dir, files).then(promise.resolve);
    });

    return promise;
  }

  procesFiles(dir, files) {
    const promise = new Prom();

    const next = () => {
      if (!files.length) {
        promise.resolve();
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
          this.addFileToDatabase(file);
        }
        next();
      });
    };
    next();
    return promise;
  }

  willInclude(file, fileRef) {
    if (fileRef.isDirectory()) {
      return false;
    }
    const f = file.split('.');
    const type = f[f.length - 1];
    return this.types.some(i => i === type);
  }

  addFileToDatabase(file) {
    file = file.substr(this.library.folder.length);
    file = file.replace('\\', '/').replace('//', '/');
    file = this.library.folder.replace(/^(.*?)(\\|\/)?$/, '$1') + file;
    if (!Database.findBy('media-item', 'filepath', file).length) {
      Log.info('found new file', file);
      const obj = {
        filepath: file,
        libraryId: this.library.uuid,
        mediaType: this.library.type,
        date_added: new Date().getTime(),
      };
      if (file.match(/.*sample.*/)) {
        obj.sample = true;
        obj.extra = true;
      } else if (file.match(/.*trailer.*/)) {
        obj.extra = true;
      }
      Database.setObject('media-item', obj);
    }
  }

  async checkForExtendedInfo() {
    Log.info('checking for extended info...');
    const items = Database.findBy('media-item', 'libraryId', this.library.uuid);
    // order trailers and samples to the back
    let count = items.length;
    for (let c = 0; c < count; c += 1) {
      if (items[c].attributes.extra) {
        items.push(items.splice(c, 1)[0]);
        count -= 1;
        c -= 1;
      }
    }

    const extendedInfoItems = [
      FFProbeExtendedInfo,
      ParseFileNameExtendedInfo,
      TheMovieDBSeriesAndSeasons,
      TheMovieDBExtendedInfo,
      ExtrasExtendedInfo,
    ];

    while (items.length) {
      const item = items.pop();
      for (let c = 0; c < extendedInfoItems.length; c += 1) {
        // eslint-disable-next-line no-await-in-loop
        await extendedInfoItems[c].extendInfo(item, this.library);
      }
      Database.update('media-item', item);
    }
    Log.info('done checking extended info');

    this.scanNext();
  }
}

// MovieScanner is a singleton!
module.exports = new MovieScanner();
