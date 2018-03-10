/**
 * Created by owenray on 08-04-16.
 */


const FFMpeg = require('../../helpers/FFMpeg');
const Database = require('../../Database');
const httpServer = require('../../HttpServer');

const Log = require('../../helpers/Log');
const RequestHandler = require('../RequestHandler');
const { PassThrough } = require('stream');

class Mpeg4PlayHandler extends RequestHandler {
  handleRequest() {
    const mediaItem = Database.getById('media-item', this.context.params.id);
    this.context.set('Accept-Ranges', 'none');
    this.ffmpeg = new FFMpeg(mediaItem, '-')
      .setPlayOffset(this.context.params.offset)
      .setOnReadyListener(this.onFFMpegReady.bind(this))
      .addOutputArguments([
        '-f', 'mp4',
        '-movflags', 'empty_moov',
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

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onFFMpegReady() {
    this.context.req.connection.on('close', () => {
      Log.debug('close video play connection!');
      this.ffmpeg.kill();
    });

    this.ffmpeg.getOutputStream().on('data', this.onData.bind(this));

    this.context.body = new PassThrough();
    this.context.body.on('close', () => {
      this.ffmpeg.kill();
    });
    this.resolve();
  }

  onData(data) {
    this.bufferedChuncks += 1;
    if (this.bufferedChuncks > 20) {
      this.ffmpeg.getOutputStream().pause();
    }
    this.context.body.write(data, () => {
      this.bufferedChuncks -= 1;
      if (this.ffmpeg.getOutputStream().isPaused() && this.bufferedChuncks <= 19) {
        this.ffmpeg.getOutputStream().resume();
      }
    });
  }
}

httpServer.registerRoute('get', '/ply/:id', Mpeg4PlayHandler, false, 0);
httpServer.registerRoute('get', '/ply/:id/:offset', Mpeg4PlayHandler, false, 0);

module.exports = Mpeg4PlayHandler;
