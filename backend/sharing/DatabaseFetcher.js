const Database = require('../Database');
const EDHT = require('./EDHT');
const Settings = require('../Settings');
const Log = require('../helpers/Log');
const TcpClient = require('./TcpClient');

// @todo handle library delete
class DatabaseFetcher {
  constructor() {
    console.log('start fetcher');
    Database.addDataProvider(this.provide.bind(this));
    this.cached = { 'media-item': {} };
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
    const client = new TcpClient(ref, key, nonce);
    await client.getFile();
    let items = JSON.parse(await client.getContents());
    items = items.map((item) => {
      item.attributes.filepath = `http://localhost:${Settings.getValue('port')}${item.attributes.filepath}`;
      return item;
    });
    this.cached['media-item'][lib.uuid] = items;
  }

  provide(type) {
    if (!this.cached[type]) { return []; }
    let items = Object.values(this.cached[type]);
    if (!items.length) return [];
    items = items.reduce((red, arr) => (red ? red.concat(arr) : arr));
    return items;
  }
}

module.exports = new DatabaseFetcher();
