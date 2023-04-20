/**
 * Created by owenray on 08-04-16.
 */

const os = require('os');
const fs = require('fs');
const util = require('util');
const uuid = require('node-uuid');

const Log = require('../../core/Log');
const RequestHandler = require('../../core/http/RequestHandler');
const FileRequestHandler = require('../../core/http/coreHandlers/FileRequestHandler');
const Database = require('../../core/database/Database');
const FFMpeg = require('./FFMpeg');

const readFile = util.promisify(fs.readFile);

class HLSContainer extends RequestHandler {
  handleRequest(profile) {
    const { params, query } = this.context;
    const mediaItem = Database.getById('media-item', params.id);

    if (this.request.headers['x-playback-session-id'] && !query.session) {
      this.context.query.session = this.request.headers['x-playback-session-id'];
    }

    if (query.session && HLSContainer.sessions[query.session]) {
      return HLSContainer.sessions[query.session]
        .newRequest(this.context, query.segment);
    }

    Log.debug('STARTING NEW HLS SESSION!!!');
    const id = query.session ? query.session : uuid.v4();
    this.session = id;
    const redirectUrl = `/ply/${mediaItem.id}/0?profile=${profile.name}&format=hls&session=${id}`;
    this.profile = profile;
    Log.debug('started hls session', redirectUrl);

    HLSContainer.sessions[id] = this;
    this.setSessionTimeout();

    // prepare for decoding
    let dir = `${os.tmpdir()}/remote_cache`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    dir += `/${this.session}/`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    this.m3u8 = `${dir}vid.m3u8`;

    const [baseUrl] = this.request.url.split('?');
    this.ffmpeg = new FFMpeg(mediaItem, this.m3u8, profile)
      .setPlayOffset(params.offset)
      .addOutputArguments([
        '-hls_base_url',
        `${baseUrl}?profile=${profile.name}&format=hls&session=${this.session}&segment=`,
      ])
      .setOnClose(this.onClose.bind(this))
      .setOnReadyListener(this.onReady.bind(this))
      .run();

    if (query.session) {
      return this.newRequest(this.context);
    }
    this.context.response.status = 302;
    this.response.set('Content-Type', 'application/x-mpegURL');
    this.response.set('Location', redirectUrl);
    return true;
  }

  static getDescription(url) {
    if (url === '/ply/:id/:offset') return 'will serve an hls if user agent is Safari from :offset in seconds';
    return 'will serve an hls if user agent is Safari, for more info check /ply/:id';
  }

  /**
     * timeout sessions and cleanup disk when sessions are no longer in use
     */
  setSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    // session will time out after 2 minutes of no activity
    this.sessionTimeout = setTimeout(this.timedOut.bind(this), 120000);
  }

  timedOut() {
    this.ffmpeg.resume();
    this.ffmpeg.kill();
    Log.debug('session timeout!');
    this.onClose();

    // clean up filesystem
    const parts = this.m3u8.split('/');
    parts.pop();
    const folder = parts.join('/');
    fs.readdir(folder, (err, files) => {
      const deleteNext = () => {
        if (files.length === 0) {
          fs.rmdir(folder, () => {});
          return;
        }
        fs.unlink(files.pop(), deleteNext);
      };
      deleteNext();
    });
  }

  newRequest(context, segment) {
    this.setSessionTimeout();
    if (segment) { // serve ts file
      context.response['Accept-Ranges'] = 'none';
      const file = `${os.tmpdir()}/remote_cache/${this.session}/${segment}`;
      Log.debug('return hls');
      if (!this.playStart) { // set the play start time when serving first ts file
        this.playStart = new Date().getTime();
      }
      return new FileRequestHandler(context)
        .serveFile(file, true);
    }

    if (!this.profile.neverPause && !this.ffmpeg.paused && !this.playStart) {
      setTimeout(() => this.newRequest(context, segment), 1000);
      return null;
    }

    return this.serveHls(context);
  }

  /**
     * @param response
     *
     * Make sure the first hls that's requested has no more then three chunks
     * this is to ensure the browser will not skip any chunks
     */
  serveHls(context) {
    context.response.set('Content-Type', 'application/x-mpegURL');
    if (context.query.nothrottle)
      return new FileRequestHandler(context)
        .serveFile(this.m3u8, false);

    return readFile(this.m3u8)
      .then((data) => {
        context.body = '';
        const currentTime = this.playStart ? (new Date().getTime() - this.playStart) / 1000 : 0;
        let segmentTime = 0;

        const lines = `${data}`.split('\n');
        lines.splice(1, 0, '#EXT-X-START:TIME-OFFSET=0');
        let newSegments = 0;
        for (let c = 0; c < lines.length; c += 1) {
          context.body += `${lines[c]}\n`;
          if (lines[c][0] !== '#' && segmentTime >= currentTime) {
            newSegments += 1;
          } else {
            const ext = lines[c].substring(1).split(':');
            if (ext[0] === 'EXTINF') {
              segmentTime += parseFloat(ext[1]);
            }
          }
          if (newSegments === (!this.playStart ? 3 : 5)) {
            break;
          }
        }
      });
  }

  onReady() {
    if (this.profile.neverPause) return;
    this.checkPause();
    this.checkPauseInterval = setInterval(this.checkPause.bind(this), 100);
  }

  /**
     * pauses the video encoding process when there are enough chunks available
     */
  checkPause() {
    fs.readdir(`${os.tmpdir()}/remote_cache/${this.session}/`, (err, files) => {
      if (err) {
        return;
      }
      const limit = this.profile.maxBufferedChunks;
      if (files.length > limit && !this.ffmpeg.paused) {
        this.ffmpeg.pause();
      } else if (files.length <= limit && this.ffmpeg.paused) {
        this.ffmpeg.resume();
      }
    });
  }

  onClose() {
    clearInterval(this.checkPauseInterval);
  }
}

HLSContainer.sessions = [];
module.exports = HLSContainer;
