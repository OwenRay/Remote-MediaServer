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
      if (this.onResult) { this.onResult(this, false); }
      Log.debug('client connect error', err, host, port);
    });
  }

  setOnConnect(onConnect) {
    this.onConnect = onConnect;
  }

  setOnResult(onResult) {
    this.onResult = onResult;
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

  writeAndStream(reference, extra, writeOut) {
    Log.debug('try to download file from', this.peer, reference, extra);
    EDHT.announce(reference);

    Log.debug('connected to server!', this.peer);
    this.client.write(`${reference}${extra}\r\n`);

    let finished = 0;
    writeOut.forEach(s => this.client.pipe(s));
    writeOut.forEach(s => s.on('finish', () => {
      finished += 1;
      if (this.errored) {
        return;
      }
      if (finished === writeOut.length) this.onResult(this, this.client.bytesRead > 0);
    }));

    // timeout the connection when not receiving data for 3 seconds
    setTimeout(this.timeOut, 10000);
  }

  timeOut() {
    Log.debug('no data received, conn timeout', this.peer);
    if (this.client.bytesRead > 0) return;
    this.end();
    this.errored = true;
    this.onResult(this, false);
  }
}

module.exports = TcpConnection;
