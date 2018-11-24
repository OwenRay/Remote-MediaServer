const fs = require('fs');
const Database = require('../Database');
const EDHT = require('./EDHT');
const Settings = require('../Settings');
const Log = require('../helpers/Log');
const TcpClient = require('./TcpClient');

// @todo handle library delete
class DatabaseFetcher {
  constructor() {
    Database.addDataProvider(this.provide.bind(this));
    Database.addUpdateOverwriter(this.overwriteUpdate.bind(this));
    this.cached = { 'media-item': {} };
    try {
      this.diffs = JSON.parse(fs.readFileSync('share/diffs'));
    } catch (e) {
      this.diffs = {};
      Log.debug('no share/diffs');
    }
    EDHT.setOnreadyListener(this.onReady.bind(this));
  }

  onReady() {
    this.refreshDatabase();
    // refresh every 15 mins
    setInterval(this.refreshDatabase.bind(this), 15 * 60 * 1000);
    Settings.addObserver('libraries', this.refreshDatabase.bind(this));
  }

  async refreshDatabase() {
    if (this.refreshing) return;
    this.refreshing = true;
    const libs = Settings.getValue('libraries').filter(lib => lib.type === 'shared');
    try {
      await Promise.all(libs.map(this.fetchLib.bind(this)));
    } catch (e) {
      Log.debug(e);
    }
    this.refreshing = false;
  }

  async fetchLib(lib) {
    Log.debug('try to fetch!!', lib.uuid);
    const [ref, key, nonce] = lib.uuid.split('-');
    const value = await EDHT.getValue(Buffer.from(ref, 'hex'));
    // @todo delete old database if necessary
    if (value.v.length !== 20) {
      Log.exception('Something is wrong with library', lib);
      return;
    }
    const client = new TcpClient(value.v.toString('hex'), key, nonce);
    await client.downloadFile();
    let items = JSON.parse(await client.getContents());
    Log.debug('fetched database', lib.uuid);

    const diffs = this.diffs[ref];
    items = items.map((item) => {
      item.attributes.filepath = `http://127.0.0.1:${Settings.getValue('port')}${item.attributes.filepath}`;
      return item;
    });
    this.cached['media-item'][ref] = items;
  }

  provide(type) {
    if (!this.cached[type]) { return []; }
    let items = Object.values(this.cached[type]);
    if (!items.length) return [];
    items = items.reduce((red, arr) => (red ? red.concat(arr) : arr));
    items = items.map((i) => {
      const lib = this.diffs[i.attributes.libraryId];
      if (!lib) return i;
      return lib[i.id] ? DatabaseFetcher.applyDiff(i, lib[i.id]) : i;
    });
    return items;
  }

  overwriteUpdate(item) {
    const libId = item.attributes.libraryId;
    const localLib = this.cached['media-item'][libId];
    if (item.type !== 'media-item' || !localLib) {
      Log.debug('no overw');
      return false;
    }

    if (!this.diffs[libId]) this.diffs[libId] = {};
    const localItem = localLib.find(i => i.id === item.id);
    this.diffs[libId][item.id] = {
      attributes: DatabaseFetcher.diff(localItem.attributes || {}, item.attributes || {}),
      relationships: DatabaseFetcher.diff(localItem.relationships || {}, item.relationships || {}),
    };
    DatabaseFetcher.applyDiff(localItem, this.diffs[libId][item.id]);
    this.saveDiff();
    return true;
  }

  saveDiff() {
    clearTimeout(this.saveInterval);
    this.saveInterval = setTimeout(() => {
      fs.writeFile('share/diffs', JSON.stringify(this.diffs), () => {
        Log.debug('share/diffs written');
      });
    }, 1000);
  }

  static diff(a, b) {
    const o = {};
    Object.keys(b).forEach((key) => {
      if (a[key] === b[key] || JSON.stringify(a[key]) === JSON.stringify(b[key])) return;
      o[key] = b[key];
    });
    return o;
  }

  static applyDiff(a, b) {
    a.attributes = Object.assign(a.attributes || {}, b.attributes);
    a.relationships = Object.assign(a.relationships || {}, b.relationships);
    return a;
  }
}

module.exports = new DatabaseFetcher();
