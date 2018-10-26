const Database = require('../Database');
const IPFS = require('./IPFS');
const Settings = require('../Settings');
const Log = require('../helpers/Log');

// @todo handle library delete
class Fetcher {
  constructor() {
    Database.addDataProvider(this.provide.bind(this));
    this.cached = { 'media-item': {} };
    IPFS.setOnreadyListener(this.onReady.bind(this));
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
    const libs = Settings.getValue('libraries').filter(lib => lib.type === 'ipfs');
    try {
      await Promise.all(libs.map(this.fetchLib.bind(this)));
    } catch (e) {
      Log.debug(e);
    }
    this.refreshing = false;
  }

  async fetchLib(lib) {
    const hash = await IPFS.execAndReturnOutput('name', 'resolve', lib.uuid);
    let data = await IPFS.getFile(hash.split('\n')[0]);
    data = JSON.parse(data).map((item) => {
      item.attributes.filepath = `http://localhost:8234/${item.attributes.filepath}`;
      return item;
    });
    this.cached['media-item'][lib.uuid] = data;
    Log.debug('IPFS fetched', lib.uuid);
  }

  provide(type) {
    if (!this.cached[type]) { return []; }
    let items = Object.values(this.cached[type]);
    if (!items.length) return [];
    items = items.reduce((red, arr) => (red ? red.concat(arr) : arr));
    return items;
  }
}

module.exports = new Fetcher();
