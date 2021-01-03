/**
 * Created by owenray on 08-04-16.
 */


const FFMpeg = require('./FFMpeg');
const Database = require('../../core/database/Database');

const Log = require('../../core/Log');
const RequestHandler = require('../../core/http/RequestHandler');
const { PassThrough } = require('stream');

const sessions = {};

const backBufferSize = 10 * 1000 * 1000;

class Mpeg4Container extends RequestHandler {
  handleRequest(profile) {
    if (!this.context.query.id) {
      this.response.status = 302;
      this.response.set('Location', `?id=${Math.random()}`);
      return null;
    }
    this.context.set('Accept-Ranges', 'bytes');
    this.context.set('Content-Type', 'video/mp4');

    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });

    if (sessions[this.context.query.id]) {
      if (sessions[this.context.query.id].attach(this.context, this.resolve, profile)) {
        return null;
      }
    }

    sessions[this.context.query.id] = this;
    this.startEncoding(profile);

    return promise;
  }

  startEncoding(profile) {
    this.buffer = Buffer.alloc(backBufferSize);
    this.offset = 0;
    const mediaItem = Database.getById('media-item', this.context.params.id);
    this.context.set('Access-Control-Allow-Origin', '*');

    this.ffmpeg = new FFMpeg(mediaItem, '-', profile)
      .setPlayOffset(this.context.params.offset)
      .setOnReadyListener(this.onFFMpegReady.bind(this))
      .addOutputArguments([
        '-f', 'mp4',
      ]);
    if (this.context.query.audioChannel) {
      this.ffmpeg.setAudioChannel(this.context.query.audioChannel);
    }
    if (this.context.query.videoChannel) {
      this.ffmpeg.setVideoChannel(this.context.query.videoChannel);
    }

    this.ffmpeg.run();
    this.ffmpeg.setOnClose(this.onClose.bind(this));
    this.bufferedChuncks = 0;
    Log.debug(`starting to play:${this.file}`);
  }

  onClose() {
    this.ffmpegEnded = true;
    if (this.bufferedChuncks === 0) {
      this.context.body.end();
    }
  }

  static getDescription(nethod, url) {
    if (url === '/ply/:id/:offset') {
      return 'will serve an mp4 h264 aac from :offset in seconds,  \n' +
      'for more info check /ply/:id';
    }
    return `${__dirname}/playhandler.md`;
  }

  onFFMpegReady() {
    if (!this.offset) {
      this.ffmpeg.getOutputStream().on('data', this.onData.bind(this));
    }

    this.context.body = new PassThrough();

    this.context.body.on('close', () => {
      Log.debug('close video play connection!');
      this.ffmpeg.pause();
      // wait 20 minutes before killing the session
      // (seems like enough time for the average break to me;)
      this.waitToKill = setTimeout(this.kill.bind(this), 1200000);
    });
    this.resolve();
  }

  kill() {
    this.ffmpeg.kill();
  }

  attach(context) {
    this.context = context;
    this.context.body = new PassThrough();
    this.onFFMpegReady();
    const range = this.context.get('Range');
    let offset = 0;
    if (range) {
      offset = parseInt(range.split('=')[1].split('-')[0], 10);
    }
    if (offset > this.offset - backBufferSize && offset < this.offset) {
      const size = this.offset - offset;
      if (size < backBufferSize) {
        context.response.status = 206;
        const localOffset = offset % backBufferSize;
        const buf = Buffer.alloc(size);
        const i = this.buffer.copy(buf, 0, localOffset);
        this.buffer.copy(buf, i, 0, size - i);

        this.context.set('Content-Range', `bytes ${offset}-${(offset + backBufferSize)}/*`);
        clearTimeout(this.waitToKill);

        this.context.body.write(buf, () => {
          this.bufferedChuncks = 0;
          this.waitToKill = false;
          this.ffmpeg.resume();
        });
        return true;
      }
    }

    return false;
  }

  onData(data) {
    const offset = this.offset % backBufferSize;
    if (offset + data.length >= backBufferSize) {
      const i = data.copy(this.buffer, offset, 0, backBufferSize - offset);
      data.copy(this.buffer, 0, i);
    } else {
      data.copy(this.buffer, this.offset);
    }
    this.offset += data.length;

    if (this.waitToKill || this.ffmpegEnded) {
      Log.warning('ondata after close!!!');
      return;
    }

    this.bufferedChuncks += 1;
    let pause = !this.context.body.write(data, () => {
      this.bufferedChuncks -= 1;
      if (!this.waitToKill &&
        this.ffmpeg.paused &&
        this.bufferedChuncks <= 19) {
        this.ffmpeg.resume();
      }
    });
    pause = pause || this.bufferedChuncks >= 20;
    if (pause) {
      this.ffmpeg.pause();
      this.context.body.once('drain', () => {
        this.ffmpeg.resume();
        this.bufferedChuncks = 0;
      });
    }
  }
}

module.exports = Mpeg4Container;
