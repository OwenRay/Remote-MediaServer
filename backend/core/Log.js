/* eslint-disable no-console */

const Settings = require('./Settings');

const listeners = [];

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

  static notifyUser(event, ...message) {
    Log.log(Log.LEVEL.NOTIFY_USER, [event, ...message]);
  }

  static addListener(f) {
    listeners.push(f);
  }

  static log(level, message) {
    listeners.forEach((f) => f(level, message));
    message.unshift(new Date());
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
  DEBUG: 0, INFO: 1, WARNING: 3, EXCEPTION: 4, NOTIFY_USER: 5,
};

module.exports = Log;
