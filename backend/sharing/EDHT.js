const DHT = require('bittorrent-dht');
const Log = require('../helpers/Log');
const Settings = require('../Settings');
const ed = require('ed25519-supercop');
const ip = require('ip');


class EDHT {
  constructor() {
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
      // bootstrap: [],
      bootstrap: Settings.getValue('dhtbootstrap'),
      nodeId: Settings.getValue('nodeid') ? Buffer.from(Settings.getValue('nodeid'), 'hex') : '',
    });
    const { dht } = this;

    if (Settings.setValue('nodeid', dht.nodeId.toString('hex'))) {
      Settings.save();
    }
    dht.listen(Settings.getValue('shareport'), () => { Log.info('dht listening', this.dht.address()); });
    dht.on('ready', this.onReady.bind(this));
    dht.on('peer', this.onPeer.bind(this));
    dht.on('warning', (e) => { Log.info('dht warn', e); });
    dht.on('error', (e) => { Log.info('dht err', e); });

    setInterval(this.publishDatabase.bind(this), 10000);
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
    this.readyListeners.forEach(cb => cb());
  }

  onPeer(peer, infoHash) {
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

  async publishDatabase() {
    return new Promise((resolve) => {
      const offset = Settings.getValue('dhtoffset') + 1;
      const value = Buffer.alloc(200).fill('IHaveADatabase');
      const opts = {
        k: this.keypair.publicKey,
        seq: offset,
        v: value,
        sign: buf => ed.sign(buf, this.keypair.publicKey, this.keypair.secretKey),
      };

      this.dht.put(opts, (err, hash) => {
        this.dht.announce(hash);
        hash = hash.toString('hex');
        Settings.setValue('dhtoffset', offset);
        Settings.setValue('sharekey', hash);
        Settings.save();
        resolve(hash);
      });
    });
  }

  addPeerObserver(hash, cb) {
    hash = hash.toString('hex');
    if (!this.peerObservers[hash]) { this.peerObservers[hash] = []; }
    this.peerObservers[hash].push(cb);
  }

  removePeerObserver(hash, cb) {
    hash = hash.toString('hex');
    const arr = this.peerObservers[hash];
    const index = arr.indexOf(cb);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  }

  share(value) {
    return new Promise((resolve) => {
      this.dht.put(value, (er, hash) => {
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
}

module.exports = new EDHT();
