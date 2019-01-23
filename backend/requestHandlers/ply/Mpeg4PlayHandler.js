/**
 * Created by owenray on 08-04-16.
 */


const FFMpeg = require('../../helpers/FFMpeg');
const Database = require('../../Database');
const httpServer = require('../../HttpServer');

const Log = require('../../helpers/Log');
const RequestHandler = require('../RequestHandler');
const { PassThrough } = require('stream');

const sessions = {};
const backBufferSize = 15 * 1000 * 1000;

class Mpeg4PlayHandler extends RequestHandler {
  handleRequest() {
    if (!this.context.query.id) {
      this.response.status = 302;
      this.response.set('Location', `?id=${Math.random()}`);
      return;
    }
    this.context.set('Accept-Ranges', 'none');
    this.context.set('Content-Type', 'video/webm');

    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });
    //this.context.set('Content-Range', 'bytes 0-');
    this.buffer = Buffer.alloc(backBufferSize);
    this.offset = 0;

    if (sessions[this.context.query.id]) {
      sessions[this.context.query.id].attach(this.context);
      return;
    }

    sessions[this.context.query.id] = this;
    const mediaItem = Database.getById('media-item', this.context.params.id);
    this.ffmpeg = new FFMpeg(mediaItem, '-')
      .setPlayOffset(this.context.params.offset)
      .setOnReadyListener(this.onFFMpegReady.bind(this))
      .addOutputArguments([
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
      ]);
    if (this.context.query.audioChannel) {
      this.ffmpeg.setAudioChannel(this.context.query.audioChannel);
    }
    if (this.context.query.videoChannel) {
      this.ffmpeg.setVideoChannel(this.context.query.videoChannel);
    }


    this.ffmpeg.run();
    this.bufferedChuncks = 0;
    Log.debug(`starting to play:${this.file}`);

    return promise;
  }

  onFFMpegReady() {

    if(!this.offset) {
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
    this.onFFMpegReady();
    const range = this.context.get('Range');
    let offset = 0;
    if (range) {
      offset = parseInt(range.split('=')[1].split('-')[0], 10);
    }
    if (offset > this.offset - backBufferSize && offset < this.offset) {
      const size = this.offset - offset;
      if (size < backBufferSize) {
        const localOffset = (this.offset - size) % backBufferSize;
        const buf = Buffer.alloc(size);
        const i = this.buffer.copy(buf, 0, localOffset);
        this.buffer.copy(buf, i, size - i);

        this.context.set('Content-Range', `bytes ${offset}-`);
        clearTimeout(this.waitToKill);
        this.waitToKill = false;
        const written = this.context.body.write(buf, () => {
          this.ffmpeg.resume();
        });
        console.log(written);
      }
    } else {
      this.buffer = [];
      console.log("need implement reencode");
    }
  }

  onData(data) {
    const offset = this.offset % backBufferSize;
    if (offset + data.length >= backBufferSize) {
      data.copy(this.buffer, offset, 0, backBufferSize - offset);
      data.copy(this.buffer, 0, (offset + data.length) % backBufferSize);
    } else {
      data.copy(this.buffer, this.offset);
    }
    this.offset += data.length;

    if (this.waitToKill) {
      console.log('ondata after close!!!');
    }

    this.bufferedChuncks += 1;
    let pause = !this.context.body.write(data, () => {
      this.bufferedChuncks -= 1;
      if (!this.waitToKill &&
        this.ffmpeg.getOutputStream().isPaused() &&
        this.bufferedChuncks <= 19) {
        this.ffmpeg.getOutputStream().resume();
      }
    });
    pause = pause || this.bufferedChuncks >= 20;
    if (pause) {
      this.ffmpeg.getOutputStream().pause();
    }
  }
}

httpServer.registerRoute('get', '/ply/:id', Mpeg4PlayHandler, false, 0);
httpServer.registerRoute('get', '/ply/:id/:offset', Mpeg4PlayHandler, false, 0);

module.exports = Mpeg4PlayHandler;
