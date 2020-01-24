const EDHT = require('./EDHT');
const Crypt = require('./Crypt');
const fs = require('fs');
const Log = require('../../core/Log');
const TcpConnection = require('./TcpConnection');
const FileProcessor = require('./FileProcessor');

class TcpClient {
  constructor(reference, key, nonce, expectedSize = 0) {
    this.connections = {};
    this.expectedSize = expectedSize;
    this.reference = Buffer.from(reference, 'hex');
    this.key = Buffer.from(key, 'hex');
    this.nonce = Buffer.from(nonce, 'hex');
    this.onPeer = this.onPeer.bind(this);
    this.cachePath = `share/${reference}`;
    this.writeOut = [];
  }

  downloadFile() {
    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    this.start();
    return promise;
  }

  streamFile(onDone, extraInfo) {
    this.extraInfo = extraInfo;
    const s = Crypt.decrypt(this.key, this.nonce);
    this.writeOut.push(s);
    this.start();
    return s;
  }

  start() {
    fs.stat(this.cachePath, (err) => {
      if (!err && this.writeOut.length) {
        fs.createReadStream(this.cachePath)
          .pipe(this.writeOut[0]);
        this.writeOut[0].on('finish', () => {
          if (this.resolve) this.resolve(this.cachePath);
        });
      } else if (!err) {
        this.resolve();
      } else {
        Log.debug('downloaded', this.reference);
        const writeCache = fs.createWriteStream(`${this.cachePath}.incomplete`, { flags: 'w' });
        writeCache.on('error', (e) => { Log.warning('share cache warn:', e); });
        this.writeOut.push(writeCache);
        EDHT.addPeerObserver(this.reference, this.onPeer);
        this.requestPeers();
        this.findPeerInterval = setInterval(this.requestPeers.bind(this), 10000);
      }
    });
  }

  stop() {
    this.complete(false);
  }

  requestPeers() {
    EDHT.findPeers(this.reference)
      .then(this.onAllPeers.bind(this));

    // also request peers that host a full library
    if (!this.extraInfo) return;
    const hash = EDHT.getHash(Buffer.from(this.extraInfo.split('-')[0], 'hex'));
    EDHT.findPeers(hash)
      .then(this.onAllPeers.bind(this));
  }

  onAllPeers(peers) {
    if (!peers) { return; }
    peers.forEach(this.onPeer.bind(this));
  }

  onPeer(peer) {
    if (this.ended) return;
    const p = `${peer.host}:${peer.port}`;
    if (this.connections[p]) {
      return;
    }

    // try to connect to peer
    const con = new TcpConnection(peer);
    con.setOnConnect(this.onConnect.bind(this));
    this.connections[p] = con;
  }

  /**
   *
   * @param connection {TcpConnection}
   */
  onConnect(connection) {
    if (this.downloading) {
      Log.debug('already downloading, so not downloading from', connection.peer.host);
      return;
    }

    // tell the peer to start download
    this.downloading = connection;
    connection.setOnResult(this.onResult.bind(this));
    connection.writeAndStream(
      this.reference.toString('hex'),
      this.extraInfo ? `-${this.extraInfo}` : '',
      this.writeOut,
    );
  }

  onResult(con, success) {
    if (success) {
      this.complete(true);
      return;
    }
    Log.debug('download from', con.peer, 'failed');
    // @todo handle partial downloads
    const p = `${con.peer.host}:${con.peer.port}`;
    this.downloading = false;
    delete this.connections[p];
    const nxt = Object.values(this.connections).find(c => c.connected);
    if (nxt) this.onConnect(nxt);
  }

  getDecodeBuffer() {
    const stream = fs.createReadStream(this.cachePath);
    return stream.pipe(Crypt.decrypt(this.key, this.nonce));
  }

  getContents() {
    return new Promise((resolve) => {
      const stream = this.getDecodeBuffer();
      let ret = '';
      stream.on('data', (data) => {
        ret += `${data}`;
      });
      stream.on('end', () => {
        resolve(ret);
      });
    });
  }

  async complete(success) {
    Log.debug('finished downloading', this.reference.toString('hex'));
    Object.values(this.connections).forEach(con => con.end());
    this.ended = true;
    clearInterval(this.findPeerInterval);
    EDHT.removePeerObserver(this.reference, this.onPeer);

    if (!success) {
      fs.unlink(`${this.cachePath}.incomplete`, () => {
        Log.debug('removed incomplete download');
      });
    } else {
      FileProcessor.registerDownload(this.reference, this.expectedSize);
      fs.rename(`${this.cachePath}.incomplete`, this.cachePath, () => {
        EDHT.announce(this.reference);
        Log.debug('chunk downloaded');
        if (this.resolve) this.resolve(this.cachePath);
      });
    }
  }
}
module.exports = TcpClient;
