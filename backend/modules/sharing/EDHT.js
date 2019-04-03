const DHT = require('bittorrent-dht');
const Log = require('../../core/Log');
const Settings = require('../../core/Settings');
const ed = require('ed25519-supercop');
const ip = require('ip');
const core = require('../../core');
const bencode = require('bencode');

const enc = bencode.encode;
const dec = bencode.decode;
bencode.encode = (data) => {
  const encoded = enc(data);
  const buffer = Buffer.alloc(encoded.length + 2);
  buffer.write('rm');
  encoded.copy(buffer, 2);
  return buffer;
};

bencode.decode = buffer => dec(buffer, 2);


class EDHT {
  constructor() {
    core.addAfterStartListener(() => {
      const debug = core.getModule('debug');
      if (!debug) return;
      debug.registerDebugInfoProvider('sharing', this.debugInfo.bind(this));
    });

    this.readyListeners = [];
    this.peers = {};
    this.peerObservers = {};
    this.checkForKeys();
    let h = Settings.getValue('sharehost');
    if (!h) h = ip.address();
    this.host = `${h}:${Settings.getValue('shareport')}`;
    Log.debug('start listening on', this.host);
    this.dht = new DHT({
      verify: ed.verify,
      host: this.host,
      bootstrap: Settings.getValue('dhtbootstrap'),
      nodeId: Settings.getValue('nodeid') ? Buffer.from(Settings.getValue('nodeid'), 'hex') : '',
      maxValues: 60000,
      timeBucketOutdated: 10 * 60 * 1000,
    });
    const { dht } = this;

    if (Settings.setValue('nodeid', dht.nodeId.toString('hex'))) {
      Settings.save();
    }
    dht.listen(Settings.getValue('shareport'), () => { Log.info('dht listening', this.dht.address()); });
    dht.on('ready', this.onReady.bind(this));
    dht.on('peer', this.onPeer.bind(this));
    dht.on('warning', (e) => { Log.debug('dht warn', e); });
    dht.on('error', (e) => { Log.warning('dht err', e); });

    setInterval(this.publishDatabase.bind(this), 60 * 60 * 1000);
  }

  checkForKeys() {
    if (!Settings.getValue('dht25519pub')) {
      const keypair = ed.createKeyPair(ed.createSeed());
      Settings.setValue('dht25519pub', keypair.publicKey.toString('hex'));
      Settings.setValue('dht25519priv', keypair.secretKey.toString('hex'));
      Settings.save();
      this.keypair = keypair;
      return;
    }
    this.keypair = {
      publicKey: Buffer.from(Settings.getValue('dht25519pub'), 'hex'),
      secretKey: Buffer.from(Settings.getValue('dht25519priv'), 'hex'),
    };
  }

  debug() {
    Log.info(this.dht.toJSON());
  }

  onReady() {
    this.ready = true;
    this.publishDatabase();
    this.readyListeners.forEach(cb => cb());
  }

  onPeer(peer, infoHash, host) {
    if (host) {
      // I suspect a host doesn't always properly report their own chunks
      // this might be a workaround, but I'm not even sure.
      // this.onPeer({ host: host.address, port: host.port }, infoHash);
    }

    if (`${peer.host}:${peer.port}` === this.host) {
      return;
    }
    const hash64 = infoHash.toString('hex');
    if (!this.peers[hash64]) this.peers[hash64] = [];
    this.peers[hash64].push(peer);
    if (this.peerObservers[hash64]) {
      this.peerObservers[hash64].forEach((cb) => {
        cb(peer);
      });
    }
  }

  setOnreadyListener(cb) {
    this.readyListeners.push(cb);
    if (this.ready) {
      cb();
    }
  }

  publishDatabase(changed = false) {
    if (this.publishing) {
      this.pendingPublishChanged = this.pendingPublishChanged || changed;
      this.pendingPublish = true;
      return this.publishing;
    }
    this.publishing = new Promise(async (resolve) => {
      let offset = Settings.getValue('dhtoffset');
      if (changed) {
        offset += 1;
        Settings.setValue('dhtoffset', offset);
      }

      const value = await this.share(this.keypair.publicKey.toString('base64') + offset);
      Settings.setValue('currentSharedDB', value.toString('hex'));
      if (changed) Settings.save();

      const opts = {
        k: this.keypair.publicKey,
        seq: offset,
        v: value,
        sign: buf => ed.sign(buf, this.keypair.publicKey, this.keypair.secretKey),
      };

      // publish new version of db
      let hash = await this.share(opts);

      // tell everyone we have all the data
      await this.share(hash);

      hash = hash.toString('hex');
      Settings.setValue('dhtoffset', offset);
      Settings.setValue('sharekey', hash);
      Settings.save();


      resolve(hash);
      this.publishing = false;

      if (this.pendingPublish) {
        this.pendingPublish = false;
        this.publishDatabase(this.pendingPublishChanged);
      }
      this.pendingPublishChanged = false;
    });
    return this.publishing;
  }

  addPeerObserver(hash, cb) {
    hash = hash.toString('hex');
    if (!this.peerObservers[hash]) { this.peerObservers[hash] = []; }
    this.peerObservers[hash].push(cb);
  }

  removePeerObserver(hash, cb) {
    hash = hash.toString('hex');
    const arr = this.peerObservers[hash];
    if (!arr) return;
    const index = arr.indexOf(cb);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  }

  getValue(key) {
    return new Promise((resolve) => {
      this.dht.get(key, (er, val) => {
        resolve(val);
      });
    });
  }

  share(value) {
    return new Promise((resolve) => {
      this.dht.put(value, (er, hash) => {
        this.dht.announce(hash);
        resolve(hash);
      });
    });
  }

  findPeers(hash) {
    const hash64 = hash.toString('hex');
    return new Promise((resolve) => {
      this.dht.lookup(hash, () => {
        resolve(this.peers[hash64]);
      });
    });
  }

  announce(hash) {
    const hash64 = hash.toString('hex');
    return new Promise((resolve) => {
      this.dht.announce(hash, Settings.getValue('shareport'), () => {
        resolve(this.peers[hash64]);
      });
    });
  }

  getHash(hash) {
    if (typeof hash === 'string') hash = Buffer.from(hash, 'hex');
    // eslint-disable-next-line no-underscore-dangle
    return this.dht._hash(bencode.encode(hash)).toString('hex');
  }

  debugInfo() {
    return { dht: this.dht.toJSON() };
  }
}

module.exports = new EDHT();
