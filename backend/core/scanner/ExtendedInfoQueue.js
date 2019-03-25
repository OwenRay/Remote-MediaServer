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

class ExtendedInfoQueue {
  static push(item) {
    // extras should be processed last
    if (item.attributes.extra) {
      queue.unshift(item);
    } else {
      queue.push(item);
    }

    clearTimeout(timeout);
    if (!running) {
      timeout = setTimeout(ExtendedInfoQueue.start.bind(this), 5000);
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

    while (queue.length) {
      const item = queue.pop();
      for (let c = 0; c < extendedInfoProviders.length; c += 1) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await extendedInfoProviders[c].extendInfo(item, libs[item.attributes.libraryId]);
        } catch (e) {
          Log.exception(e);
        }
      }
      Database.update('media-item', item);
    }
    onDrainCallbacks.forEach(cb => cb());
    Log.info('done checking extended info');

    running = false;
  }

  /**
   * @param IExtendedInfo extendedInfoProvider
   */
  static registerExtendedInfoProvider(extendedInfoProvider, highPrio) {
    if (highPrio) extendedInfoProviders.unshift(extendedInfoProvider);
    else extendedInfoProviders.push(extendedInfoProvider);
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
