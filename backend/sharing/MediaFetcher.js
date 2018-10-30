const TcpClient = require('./TcpClient');
const { PassThrough } = require('stream');
const MediaItemHelper = require('../helpers/MediaItemHelper');

class MediaFetcher {
  constructor(item) {
    this.item = item;
    this.offset = 0;
    const lib = MediaItemHelper.getLibrary(item);
    [, this.key] = lib.uuid.split('-');
  }

  startStream() {
    this.output = new PassThrough();
    this.output.on('close', this.end.bind(this));
    this.downloadNext();
    return this.output;
  }

  end() {
    if (this.ended) return;

    this.ended = true;
    this.tcpClient.stop();
  }

  downloadNext() {
    if (this.offset >= this.item.attributes.shareparts) {
      this.ended = true;
      this.output.end();
      return;
    }
    if (this.ended) return;
    this.tcpClient = new TcpClient(
      this.item.attributes.hashes[this.offset],
      this.key,
      this.item.attributes.nonce,
    );
    this.input = this.tcpClient.streamFile(this.downloadNext.bind(this), this.item.id);
    this.input.on('finish', () => {
      this.input.unpipe(this.output);
      this.downloadNext();
    });
    this.input.pipe(this.output);
    this.offset += 1;
  }
}

module.exports = MediaFetcher;
