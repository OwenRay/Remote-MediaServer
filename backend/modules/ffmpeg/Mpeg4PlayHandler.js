/**
 * Created by owenray on 08-04-16.
 */


const FFMpeg = require('./FFMpeg');
const Database = require('../../core/database/Database');
const httpServer = require('../../core/http');

const Log = require('../../core/Log');
const RequestHandler = require('../../core/http/RequestHandler');
const { PassThrough } = require('stream');

class Mpeg4PlayHandler extends RequestHandler {
  handleRequest() {
    const mediaItem = Database.getById('media-item', this.context.params.id);
    this.context.set('Accept-Ranges', 'none');
    this.context.set('Access-Control-Allow-Origin', '*');
    this.ffmpeg = new FFMpeg(mediaItem, '-')
      .setPlayOffset(this.context.params.offset)
      .setOnReadyListener(this.onFFMpegReady.bind(this))
      .addOutputArguments([
        '-f', 'mp4',
        '-movflags', 'empty_moov+omit_tfhd_offset+default_base_moof+frag_keyframe',
        '-reset_timestamps', '1',
      ]);
    if (this.context.query.audioChannel) {
      this.ffmpeg.setAudioChannel(this.context.query.audioChannel);
    }
    if (this.context.query.videoChannel) {
      this.ffmpeg.setVideoChannel(this.context.query.videoChannel);
    }
    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });

    this.ffmpeg.run();
    this.ffmpeg.setOnClose(this.onClose.bind(this));
    this.bufferedChuncks = 0;
    Log.debug(`starting to play:${this.file}`);

    return promise;
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
    this.ffmpeg.getOutputStream().on('data', this.onData.bind(this));

    this.context.body = new PassThrough();
    this.context.body.on('close', () => {
      Log.debug('close video play connection');
      this.connectionClosed = true;
      this.ffmpeg.kill();
    });
    this.resolve();
  }

  onData(data) {
    // stop writing any residual data when the connection has already closed
    if (this.connectionClosed) return;

    this.bufferedChuncks += 1;
    let pause = !this.context.body.write(data, () => {
      this.bufferedChuncks -= 1;
      if (this.bufferedChuncks === 0 && this.ffmpegEnded) {
        this.context.body.end();
      }
      if (this.ffmpeg.getOutputStream().isPaused() && this.bufferedChuncks <= 19) {
        this.ffmpeg.getOutputStream().resume();
      }
    });
    pause = pause || this.bufferedChuncks > 20;
    if (pause) {
      this.ffmpeg.getOutputStream().pause();
    }
  }
}

httpServer.registerRoute('get', '/ply/:id', Mpeg4PlayHandler, false, 0);
httpServer.registerRoute('get', '/ply/:id/:offset', Mpeg4PlayHandler, false, 0);

module.exports = Mpeg4PlayHandler;
