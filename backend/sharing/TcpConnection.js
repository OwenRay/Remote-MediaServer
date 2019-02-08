const EDHT = require('./EDHT');
const Log = require('../helpers/Log');
const net = require('net');

class TcpConnection {
  constructor({ host, port }) {
    Log.debug('try connecting to', host, port, 'to download');
    this.peer = { host, port };
    this.timeOut = this.timeOut.bind(this);

    this.client = net.createConnection(port, host, this.didConnect.bind(this));
    this.client.on('error', (err) => {
      this.errored = true;
      if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
      this.onResult(false);
      Log.debug('client connect error', err, host, port);
    });
  }

  setOnConnect(onConnect) {
    this.onConnect = onConnect;
  }

  setOnResult(onResult) {
    this.onResultCallback = onResult;
  }

  didConnect() {
    this.connected = true;
    if (this.onConnect) {
      this.onConnect(this);
    }
  }

  end() {
    this.client.end();
  }

  onResult(success) {
    if (this.resultGiven) {
      Log.warning('result already given???');
      return;
    }
    this.resultGiven = true;
    if (this.onResultCallback) this.onResultCallback(this, success);
  }

  writeAndStream(reference, extra, writeOut) {
    Log.debug('try to download file from', this.peer, reference, extra);
    EDHT.announce(reference);

    Log.debug('connected to server!', this.peer);
    this.client.write(`${reference}${extra}\n`, () => Log.debug('data written', this.peer));

    let finished = 0;
    const onFinish = () => {
      finished += 1;
      if (this.errored) {
        return;
      }
      if (finished === writeOut.length) this.onResult(this.client.bytesRead > 0);
    };

    this.client.on('close', () => {
      clearTimeout(this.timeoutTimer);
      if (this.client.bytesRead > 0) {
        writeOut.forEach(s => s.end());
      } else {
        writeOut.forEach(s => s.off('finish', onFinish));
        this.onResult(false);
      }
    });
    // timeout the connection when not receiving data for 3 seconds
    this.timeoutTimer = setTimeout(this.timeOut, 10000);

    writeOut.forEach(s => this.client.pipe(s, { end: false }));
    writeOut.forEach(s => s.on('finish', onFinish));
  }

  timeOut() {
    Log.debug('bytes read', this.client.bytesRead);
    if (this.client.bytesRead > 0) return;
    Log.debug('no data received, conn timeout', this.peer);
    this.end();
    this.errored = true;
    this.onResult(this, false);
  }
}

module.exports = TcpConnection;
