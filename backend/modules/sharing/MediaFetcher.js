const TcpClient = require('./TcpClient');
const { PassThrough } = require('stream');
const MediaItemHelper = require('../../core/MediaItemHelper');
const Log = require('../../core/Log');

/**
 * @todo handle downloads in background
 * starting the player costs about 3 requests,
 * upon the first request we should try to keep downloading in the background
 */
class MediaFetcher {
  constructor(item) {
    this.onReadable = this.onReadable.bind(this);
    this.item = item;
    this.offset = 0;
    this.hashes = this.item.attributes.hashes;
    const lib = MediaItemHelper.getLibrary(item);
    [, this.key] = lib.uuid.split('-');
  }

  startStream(offset) {
    this.offset = this.hashes.findIndex(h => offset <= h.offset + h.size);
    Log.debug('starting to download from offset: ', offset, `${this.offset}/${this.hashes.length - 1}`);
    this.skipBytes = offset - this.hashes[this.offset].offset;
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
    if (this.offset >= this.hashes.length) {
      this.ended = true;
      this.output.end();
      return;
    }
    if (this.ended) return;

    this.tcpClient = new TcpClient(
      this.hashes[this.offset].hash,
      this.key,
      this.item.attributes.nonce,
      this.hashes[this.offset].size,
    );
    this.input = this.tcpClient.streamFile(this.downloadNext.bind(this), this.item.id);
    if (this.skipBytes) {
      this.input.on('readable', this.onReadable);
    } else {
      this.input.pipe(this.output);
    }
    this.input.on('finish', () => {
      this.input.unpipe(this.output);
      this.downloadNext();
    });
    this.offset += 1;
  }

  /**
   * used to "throw away" the first x bytes of data (when handling ranged requests)
   */
  onReadable() {
    const read = this.input.readableLength > this.skipBytes ?
      this.skipBytes :
      this.input.readableLength;
    this.input.read(read);
    this.skipBytes -= read;
    if (this.skipBytes === 0) {
      this.input.off('readable', this.onReadable);
      this.input.pipe(this.output);
    }
  }

  setContextHeaders(context, offset) {
    const { filesize } = this.item.attributes;
    context.set('Content-Range', `bytes ${offset}-${filesize}/${filesize}`);
    context.set('Content-Length', filesize - offset);
    context.status = 206;
  }
}

module.exports = MediaFetcher;
