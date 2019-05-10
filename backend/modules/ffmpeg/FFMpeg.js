

const Settings = require('../../core/Settings');
const FFProbe = require('./FFProbe');
const MediaItemHelper = require('../../core/MediaItemHelper');
const Log = require('../../core/Log');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

const supportedVideoCodecs = { h264: 1 };
const supportedAudioCodecs = { aac: 1 };

class FFMpeg {
  constructor(mediaItem, output) {
    this.mediaItem = mediaItem;
    this.file = MediaItemHelper.getFullFilePath(mediaItem);
    this.output = output;
    this.outputArgs = [];
    this.inputArgs = [];
    this.vCodec = 'libx264';
    this.aCodec = 'aac';
  }

  run() {
    if (this.mediaItem.attributes.streams && this.mediaItem.attributes.format) {
      this.gotInfo(this.mediaItem.attributes);
    } else {
      FFProbe.getInfo(this.file)
        .then(this.gotInfo.bind(this), this.onError);
    }
    return this;
  }

  setOnReadyListener(onReady) {
    this.onReady = onReady;
    return this;
  }

  /**
     *
     * @param args array
     */
  addOutputArguments(args) {
    this.outputArgs = this.outputArgs.concat(args);
    return this;
  }

  /**
     *
     * @param args array
     */
  addInputArguments(args) {
    this.inputArgs = this.inputArgs.concat(args);
    return this;
  }

  setAudioChannel(channel) {
    this.audioChannel = channel;
  }

  setVideoChannel(channel) {
    this.videoChannel = channel;
  }

  setPlayOffset(offset) {
    this.offset = offset;
    return this;
  }

  setOnClose(onCloseEvent) {
    this.onCloseEvent = onCloseEvent;
    return this;
  }

  getOutputStream() {
    return this.proc.stdout;
  }

  kill() {
    this.proc.kill('SIGKILL');
  }

  setCodecs(vCodec, aCodec) {
    this.vCodec = vCodec;
    this.aCodec = aCodec;
    return this;
  }


  gotInfo(info) {
    info.streams.forEach((stream) => {
      if (stream.codec_type === 'video') {
        if (this.videoChannel === undefined) {
          this.videoChannel = stream.index;
        }
        if (`${this.videoChannel}` === `${stream.index}` && supportedVideoCodecs[stream.codec_name]) {
          this.vCodec = 'copy';
        }
      }
      if (stream.codec_type === 'audio') {
        if (this.audioChannel === undefined) {
          this.audioChannel = stream.index;
        }
        if (`${this.audioChannel}` === `${stream.index}` && supportedAudioCodecs[stream.codec_name]) {
          this.aCodec = 'aac';
        }
      }
    });

    if (this.videoChannel !== undefined) {
      this.addOutputArguments(['-map', `0:${this.videoChannel}`]);
    }
    if (this.audioChannel !== undefined) {
      this.addOutputArguments(['-map', `0:${this.audioChannel}`]);
    }

    if (this.vCodec !== 'copy') {
      this.addOutputArguments(['-preset', Settings.getValue('ffmpeg_preset')]);
    }

    const duration = Math.round((info.format.duration - this.offset) * 1000);
    Log.debug('setDuration', duration);

    // OK... this is a hack to specify the video duration...
    this.tmpFile = `${os.tmpdir()}/${Math.random()}.txt`;
    const metadata = `${';FFMETADATA1\n' +
            '[CHAPTER]\n' +
            'TIMEBASE=1/1000\n' +
            // "START=0\n"+
            'END='}${duration}\n` +
            'title=chapter #1\n';

    fs.writeFileSync(this.tmpFile, metadata);

    // om keyframe te vinden, gaat wellicht veel fixen:
    const args = [
      // "-re", // <-- should read the file at running speed... but a little to slow...
      '-y',
      '-probesize', '500000',
      '-thread_queue_size', '10240',
      '-i', this.file,
      '-i', this.tmpFile,
      '-map_metadata', '1',

      '-vcodec', this.vCodec,
      '-acodec', this.aCodec,
      '-strict', '-2',
      '-stdin',
      '-sn',
      this.output,
    ];

    if (this.aCodec !== 'copy') {
      this.addOutputArguments(['-ac', 2, '-ab', '192k']);
    }
    if (!this.offset || this.offset === '0') {
      this.offset = 0;
      if (this.file.indexOf('http') === 0) this.addInputArguments(['-seekable', '0']);
    }

    if (this.offset) {
      this.addInputArguments(['-ss', this.offset]);
      this.addOutputArguments(['-ss', 0]);
    }

    while (this.outputArgs.length) {
      args.splice(19, 0, this.outputArgs.pop());
    }
    while (this.inputArgs.length) {
      args.splice(0, 0, this.inputArgs.pop());
    }
    Log.info(`starting ffmpeg:${Settings.getValue('ffmpeg_binary')} ${args.join(' ')}`);
    const proc = spawn(
      Settings.getValue('ffmpeg_binary'),
      args,
    );
    this.proc = proc;

    proc.stderr.on('data', FFMpeg.onError);
    proc.on('close', this.onClose.bind(this));
    proc.stderr.on('error', this.onClose.bind(this));
    proc.stdin.on('error', this.onClose.bind(this));

    this.onReady();
    return this;
  }

  pause() {
    this.paused = true;
    if (this.output === '-') {
      this.proc.stdout.pause();
      return;
    }
    this.proc.stdin.write('c');
  }

  resume() {
    this.paused = false;
    if (this.output === '-') {
      this.proc.stdout.resume();
    }
    this.proc.stdin.write('\n');
  }

  onClose(code) {
    Log.debug(`Close:${code}`, this.tmpFile);
    fs.unlink(this.tmpFile, () => {});
    this.ended = true;
    if (this.onCloseEvent) {
      this.onCloseEvent();
    }
  }


  static onError(data) {
    Log.debug('ffmpeg:', `${data}`.split('\\n').join('\n'));
  }
}

module.exports = FFMpeg;
