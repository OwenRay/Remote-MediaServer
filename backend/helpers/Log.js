/* eslint-disable no-console */


const Settings = require('../Settings');

class Log {
  static debug(...message) {
    Log.log(Log.LEVEL.DEBUG, message);
  }

  static info(...message) {
    Log.log(Log.LEVEL.INFO, message);
  }

  static warning(...message) {
    Log.log(Log.LEVEL.WARNING, message);
  }

  static exception(...message) {
    Log.log(Log.LEVEL.EXCEPTION, message);
  }

  static log(level, message) {
    if (level >= Settings.getValue('verbosity')) {
      switch (level) {
        case Log.LEVEL.WARNING:
          console.warn(...message);
          break;
        case Log.LEVEL.EXCEPTION:
          console.error(...message);
          break;
        default:
          console.log(...message);
          break;
      }
    }
  }
}

Log.LEVEL = {
  DEBUG: 0, INFO: 1, WARNING: 3, EXCEPTION: 4,
};

module.exports = Log;
