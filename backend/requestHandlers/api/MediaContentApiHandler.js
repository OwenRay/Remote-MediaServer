/**
 * Created by owenray on 31-3-2017.
 */


const RequestHandler = require('../RequestHandler');
const fs = require('fs');
const db = require('../../Database');
const path = require('path');
const sub = require('srt-to-ass');
const os = require('os');
const FileRequestHandler = require('../FileRequestHandler');
const FFProbe = require('../../helpers/FFProbe');
const { spawn } = require('child_process');
const Settings = require('../../Settings');
const Log = require('../../helpers/Log');
const httpServer = require('../../HttpServer');

const supportedSubtitleFormats = ['.srt', '.ass', '.subrip'];

class SubtitleApiHandler extends RequestHandler {
  handleRequest() {
    const item = db.getById('media-item', this.context.params.id);
    if (!item) {
      return null;
    }

    this.filePath = item.attributes.filepath;
    const directory = path.dirname(this.filePath);

    if (this.context.params.file) {
      this.serveSubtitle(this.filePath, directory, this.context.params.file);
    } else {
      this.serveList(directory);
    }
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  serveList(directory) {
    fs.readdir(directory, this.onReadDir.bind(this));
  }

  serveSubtitle(videoFilePath, directory, file, deleteAfterServe) {
    const extension = path.extname(file);
    let tmpFile;
    if (file[0] === ':') {
      let filename = file.substr(1);
      if (filename.endsWith('subrip')) {
        filename += '.srt';
      }
      tmpFile = `${os.tmpdir()}/${filename}`;
      const args = [
        '-y',
        '-i', videoFilePath,
        '-map', `0${file.split('.').shift()}`,
        tmpFile,
      ];

      const proc = spawn(
        Settings.getValue('ffmpeg_binary'),
        args,
      );
      proc.stdout.on('data', (data) => {
        Log.info('ffmpeg result:', `${data}`);
      });
      proc.stderr.on('data', (data) => {
        Log.info('ffmpeg result:', `${data}`);
      });
      proc.on(
        'close',
        () => {
          this.serveSubtitle(videoFilePath, os.tmpdir(), filename, true);
        },
      );

      return null;
    }

    if (extension === '.srt' || extension === '.subrip') {
      const filename = `${file}.${Math.random()}.ass`;
      tmpFile = `${os.tmpdir()}/${filename}`;
      sub.convert(
        `${directory}/${file}`,
        tmpFile,
        {},
        () => {
          if (deleteAfterServe) {
            fs.unlink(`${directory}:${file}`, () => {});
          }
          this.serveSubtitle(videoFilePath, os.tmpdir(), filename, true);
        },
      );
      return null;
    }
    file = `${directory}/${file}`;


    return new FileRequestHandler(this.context)
      .serveFile(file, deleteAfterServe, this.resolve);
  }

  returnEmpty() {
    this.response.end('[]');
  }

  async onReadDir(err, result) {
    if (err) {
      this.resolve();
      this.returnEmpty();
      return;
    }
    const subtitles = result
      .filter(file => supportedSubtitleFormats.indexOf(path.extname(file)) !== -1)
      .map(file => ({ label: file, value: file }));
    const response = { subtitles };


    const { streams } = await FFProbe.getInfo(this.filePath);
    streams.forEach((str) => {
      let name = str.tags ? str.tags.language : str.codec_long_name;
      if (!name) {
        name = str.tags.title;
      }
      name = name || str.codec_name;
      if (supportedSubtitleFormats.indexOf(`.${str.codec_name}`) !== -1) {
        response.subtitles.push({
          label: `Built in: ${name}`,
          value: `:${str.index}.${str.codec_name}`,
        });
      } else {
        if (!response[str.codec_type]) {
          response[str.codec_type] = [];
        }
        response[str.codec_type].push({
          label: name,
          value: str.index,
        });
      }
      this.context.body = response;
      this.resolve();
    });
  }
}

httpServer.registerRoute('get', '/api/mediacontent/:id', SubtitleApiHandler);
httpServer.registerRoute('get', '/api/mediacontent/subtitle/:id/:file', SubtitleApiHandler);

module.exports = SubtitleApiHandler;
