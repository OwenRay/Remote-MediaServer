// to enable modules we'll have to suppress these eslint rules
/* eslint-disable global-require,import/no-dynamic-require */
const fs = require('fs');
const http = require('./http');
const Log = require('./Log');
const Settings = require('./Settings');

const beforeListeners = [];
const afterListeners = [];


class RemoteCore {
  static async init() {
    const dir = `${process.env.HOME || process.env.USERPROFILE}/.remote`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // make sure all settings files are in the right directory
    Log.debug('chdir', dir);
    process.chdir(dir);

    http.preflight();
    await Promise.all(beforeListeners.map(f => f()));
    await http.start();

    Settings.getValue('modules').map(m => require(`../modules/${m}`));
    afterListeners.forEach(f => f());

    require('./scanner/MovieScanner.js');
    require('./database/Migrate');
  }

  static addBeforeStartListener(func) {
    beforeListeners.push(func);
  }

  static addAfterStartListener(func) {
    afterListeners.push(func);
  }
}

module.exports = RemoteCore;
