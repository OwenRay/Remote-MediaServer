const IPFS = require('./IPFS');
const Settings = require('../Settings');
const Database = require('../Database');
const Log = require('../helpers/Log');
const extendedInfoQueue = require('../scanner/ExtendedInfoQueue').getInstance();
const fs = require('fs');

class FileProcessor {
  constructor() {
    this.itemProcessQueue = [];
    Settings.addObserver('libraries', this.onChange.bind(this));
    IPFS.setOnreadyListener(this.onReady.bind(this));
    extendedInfoQueue.setOnDrain(this.onChange.bind(this));
  }

  onReady() {
    this.onChange();
  }

  onChange() {
    if (!IPFS.ready) {
      return;
    }
    if (this.processing) {
      this.rescan = true;
      return;
    }
    this.processing = true;
    this.offset = 0;
    this.processNext();
  }

  async processNext() {
    if (this.offset >= Settings.getValue('libraries').length) {
      this.processing = false;
      if (this.rescan) {
        this.onChange();
      }
      return;
    }
    const lib = Settings.getValue('libraries')[this.offset];
    this.offset += 1;
    if (!lib.ipfs) {
      this.processNext();
      return;
    }
    if (!fs.existsSync(`ipfs/${lib.uuid}`)) {
      fs.symlinkSync(lib.folder, `ipfs/${lib.uuid}`);
    }
    this.itemProcessQueue = this.itemProcessQueue.concat(Database.findByMatchFilters(
      'media-item',
      {
        libraryId: lib.uuid,
        ipfs: 'false',
      },
    ));

    await this.processItems();
    this.processNext();
  }

  async processItems() {
    if (this.processingItems) return;
    this.processingItems = true;
    await this.processNextItem();
  }

  static getAllSharedItems() {
    const key = Settings.getValue('sharekey');
    const items = Database
      .getAll('media-item')
      .filter(o => !!o.attributes.ipfs);

    return JSON.parse(JSON.stringify(items))
      .map((item) => {
        item.id = `${key}-${item.id}`;
        item.attributes.libraryId = key;
        item.attributes.filepath = `ipfs/${item.attributes.ipfs}`;
        return item;
      });
  }

  async processNextItem() {
    if (!this.itemProcessQueue.length) {
      await IPFS.getAndSaveKey();
      fs.writeFile(
        'ipfs/db',
        JSON.stringify(FileProcessor.getAllSharedItems()),
        IPFS.publishDatabase.bind(IPFS),
      );
      this.processingItems = false;
      return;
    }

    // ok... it's not really a queue... it's a stack
    // we care more for performance then order
    const item = this.itemProcessQueue.pop();
    const lib = Settings.getValue('libraries').find(l => l.uuid === item.attributes.libraryId);
    if (!lib) {
      this.processNextItem();
      return;
    }
    const path = `ipfs/${lib.uuid}/${item.attributes.filepath.replace(lib.folder, '')}`;
    const hash = await FileProcessor.addFile(path);
    if (hash) {
      Log.debug('Added file to ipfs', path, hash);
      item.attributes.ipfs = hash;
      Database.update('media-item', item);
    }
    this.processNextItem();
  }

  static async addFile(path) {
    const hash = await IPFS.execAndReturnOutput('add', '-Q', '--nocopy', path);
    return hash.split('\n')[0];
  }
}

module.exports = new FileProcessor();
