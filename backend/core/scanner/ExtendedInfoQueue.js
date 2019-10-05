const Database = require('../database/Database');
const Log = require('../Log');
const Settings = require('../Settings');
const core = require('../../core');
require('./ExtrasExtendedInfo');

const extendedInfoProviders = [];
const onDrainCallbacks = [];
const queue = [];
let running = false;
let timeout;

/**
 * there's a queue for every extending function, once the first queue (with priority) is empty
 * the next queue will start processing
 */
class ExtendedInfoQueue {
  static push(item) {
    // extras should be processed last
    if (item.attributes.extra) {
      queue.forEach(q => q.unshift(item));
    } else {
      queue.forEach(q => q.push(item));
    }

    clearTimeout(timeout);
    if (!running) {
      timeout = setTimeout(ExtendedInfoQueue.start.bind(this), 1000);
    }
  }

  static concat(items) {
    items.forEach(item => ExtendedInfoQueue.push(item));
  }

  static async start() {
    const libs = {};
    Settings.getValue('libraries').forEach((library) => {
      libs[library.uuid] = library;
    });

    running = true;
    Log.debug('processing', queue.length);
    ExtendedInfoQueue.next(libs);
  }
  static async next(libs) {
    const next = queue.findIndex(q => q.length);
    if (next === -1) {
      onDrainCallbacks.forEach(cb => cb());
      running = false;
      return;
    }
    const item = queue[next].pop();
    await extendedInfoProviders[next].extendInfo(item, libs[item.attributes.libraryId]);
    Database.update('media-item', item);
    ExtendedInfoQueue.next(libs);
  }

  /**
   * @param IExtendedInfo extendedInfoProvider
   */
  static registerExtendedInfoProvider(extendedInfoProvider, highPrio) {
    if (highPrio) extendedInfoProviders.unshift(extendedInfoProvider);
    else extendedInfoProviders.push(extendedInfoProvider);
    queue.push([]);
  }

  static setOnDrain(cb) {
    onDrainCallbacks.push(cb);
  }

  static debugInfo() {
    return { extendedInfoQuelength: queue.length };
  }
}

core.addAfterStartListener(() => {
  const debug = core.getModule('debug');
  if (!debug) return;
  debug.registerDebugInfoProvider(
    'scanner',
    ExtendedInfoQueue.debugInfo,
  );
});

module.exports = ExtendedInfoQueue;
