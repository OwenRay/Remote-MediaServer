const Database = require('../database/Database');
const Log = require('../Log');
const Settings = require('../Settings');
const core = require('../../core');
require('./ExtrasExtendedInfo');

const extendedInfoProviders = [];
const onDrainCallbacks = [];
const queue = [];
const running = [];
let timeout;

/**
 * there's a queue for every extending function, once the first queue (with priority) is empty
 * the next queue will start processing
 */
class ExtendedInfoQueue {
  static push(item) {
    // extras should be processed last
    if (item.attributes.extra) {
      queue[0].unshift(item);
    } else {
      queue[0].push(item);
    }

    clearTimeout(timeout);
    timeout = setTimeout(ExtendedInfoQueue.start.bind(this), 1000);
  }

  static concat(items) {
    items.forEach(item => ExtendedInfoQueue.push(item));
  }

  static async start(qNumber = 0, libs = null) {
    if (running[qNumber]) return;

    if (!libs) {
      libs = {};
      Settings.getValue('libraries')
        .forEach((library) => {
          libs[library.uuid] = library;
        });
    }

    running[qNumber] = true;
    Log.debug('starting queue', qNumber);
    ExtendedInfoQueue.next(libs, qNumber);
  }
  static async next(libs, currentQ) {
    const item = queue[currentQ].pop();
    // this queue has emptied out?
    if (!item) {
      running[currentQ] = false;
      // all queues empty?
      if (!queue.some(q => q.length)) {
        onDrainCallbacks.forEach(cb => cb());
      }
      return;
    }
    await extendedInfoProviders[currentQ].extendInfo(item, libs[item.attributes.libraryId]);
    // queue for the nex
    if (queue[currentQ + 1]) {
      queue[currentQ + 1].push(item);
      this.start(currentQ + 1, libs);
    }
    Database.update('media-item', item);
    ExtendedInfoQueue.next(libs, currentQ);
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
    return {
      extendedInfoQuelength: queue.map(a => a.length),
      running,
    };
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
