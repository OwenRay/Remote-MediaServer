/**
 * Created by owenray on 31-3-2017.
 */

const fs = require('fs');
const path = require('path');
const RequestHandler = require('../../core/http/RequestHandler');
const db = require('../../core/database/Database');
const FileRequestHandler = require('../../core/http/coreHandlers/FileRequestHandler');
const FFProbe = require('./FFProbe');
const httpServer = require('../../core/http');
const Subtitles = require('../../core/Subtitles');

const supportedSubtitleFormats = ['.srt', '.ass', '.subrip'];

class SubtitleApiHandler extends RequestHandler {
  handleRequest() {
    const item = db.getById('media-item', this.context.params.id);
    if (!item) {
      return null;
    }
    this.context.set('Access-Control-Allow-Origin', '*');
    this.context.set('Content-Type', 'text/vtt');

    this.item = item;
    this.filePath = item.attributes.filepath;
    const directory = path.dirname(this.filePath);

    if (this.context.params.file) {
      return this.serveSubs(item.id, this.filePath, directory, this.context.params.file);
    }
    this.serveList(directory);

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  static getDescription(method, url) {
    if (url === '/api/mediacontent/subtitle/:id/:file') return 'serves a webvtt caption';
    return `${__dirname}/mediacontent.md`;
  }

  serveList(directory) {
    fs.readdir(directory, this.onReadDir.bind(this));
  }

  async serveSubs(id, filepath, dir, filename) {
    let f = await Subtitles.getVtt(id, filepath, dir, filename);
    let deleteAfter = false;
    if (this.context.query.offset) {
      deleteAfter = true;
      f = await Subtitles.getTimeShiftedTmpFile(f, this.context.query.offset);
    }
    return new FileRequestHandler(this.context).serveFile(f, deleteAfter)
  }

  returnEmpty() {
    this.response.end('[]');
  }

  async onReadDir(err, result = []) {
    const subtitles = result
      .filter((file) => supportedSubtitleFormats.indexOf(path.extname(file)) !== -1)
      .map((file) => ({ label: file, value: file }));
    const response = { subtitles };

    let { streams } = this.item.attributes;
    if (!streams) {
      const probe = await FFProbe.getInfo(this.filePath);
      ({ streams } = probe);
    }

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
