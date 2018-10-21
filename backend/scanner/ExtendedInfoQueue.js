const TheMovieDBExtendedInfo = require('./extendedInfo/TheMovieDBExtendedInfo');
const FFProbeExtendedInfo = require('./extendedInfo/FFProbeExtendedInfo');
const ParseFileNameExtendedInfo = require('./extendedInfo/ParseFileNameExtendedInfo');
const TheMovieDBSeriesAndSeasons = require('./extendedInfo/TheMovieDBSeriesAndSeasons');
const ExtrasExtendedInfo = require('./extendedInfo/ExtrasExtendedInfo');
const Database = require('../Database');
const Log = require('../helpers/Log');
const Settings = require('../Settings');

const extendedInfoItems = [
  FFProbeExtendedInfo,
  ParseFileNameExtendedInfo,
  TheMovieDBSeriesAndSeasons,
  TheMovieDBExtendedInfo,
  ExtrasExtendedInfo,
];

class ExtendedInfoQueue {
  static getInstance() {
    if (!ExtendedInfoQueue.instance) {
      ExtendedInfoQueue.instance = new ExtendedInfoQueue();
    }
    return ExtendedInfoQueue.instance;
  }
  constructor() {
    this.queue = [];
    this.running = false;
  }

  push(item) {
    // extras should be processed last
    if (item.attributes.extra) {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }

    clearTimeout(this.timeout);
    if (!this.running) {
      this.timeout = setTimeout(this.start.bind(this), 5000);
    }
  }

  async start() {
    const libs = {};
    Settings.getValue('libraries').forEach((library) => {
      libs[library.uuid] = library;
    });

    this.running = true;
    Log.debug('processing', this.queue.length);

    while (this.queue.length) {
      const item = this.queue.pop();
      for (let c = 0; c < extendedInfoItems.length; c += 1) {
        // eslint-disable-next-line no-await-in-loop
        await extendedInfoItems[c].extendInfo(item, libs[item.attributes.libraryId]);
      }
      Database.update('media-item', item);
    }
    Log.info('done checking extended info');

    this.running = false;
  }
}

module.exports = ExtendedInfoQueue;
