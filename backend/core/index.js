// to enable modules we'll have to suppress these eslint rules
/* eslint-disable global-require,import/no-dynamic-require */
const fs = require('fs');
const http = require('./http');
const Settings = require('./Settings');

const dirs = ['cache', 'subs', 'store'];
const beforeListeners = [];
const afterListeners = [];


class RemoteCore {
  static async init() {
    dirs.forEach((dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir); });

    Settings.getValue('modules').map(m => require(`../modules/${m}`));

    http.preflight();
    await Promise.all(beforeListeners.map(f => f()));
    await http.start();
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
