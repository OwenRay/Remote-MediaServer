const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const fs = require('fs');
const ass2vtt = require('ass-to-vtt');
const srt2vtt = require('srt-to-vtt');
const Settings = require('../Settings');
const Log = require('../helpers/Log');
const shift = require('vtt-shift');

const converters = {
  '.srt': srt2vtt,
  '.subrip': srt2vtt,
  '.ass': ass2vtt,
};

class Subtitles {
  static async getVtt(mediaId, videoFilePath, directory, file) {
    let f = await Subtitles.getCachedPath(mediaId, file);
    if (f) {
      return f;
    }
    f = await Subtitles.getPath(videoFilePath, directory, file);
    f = await Subtitles.convertedPath(f);
    if (f !== `${directory}/${file}`) { // no need to cache an existing user's vtt
      f = await Subtitles.cacheThis(f, mediaId, file);
    }
    return f;
  }

  static getTimeShiftedTmpFile(f, offsetMs) {
    return new Promise((resolve) => {
      const tmpFile = `${os.tmpdir()}/${Math.random()}.srt`;
      const writeFile = fs.createWriteStream(tmpFile);

      fs.createReadStream(f)
        .pipe(shift({ offsetMs }))
        .pipe(writeFile);
      writeFile.on('close', () => {
        resolve(tmpFile);
      });
    });
  }

  static getCachedPath(mediaId, file) {
    return new Promise((resolve) => {
      file = `subs/${mediaId}_${file}.vtt`;
      fs.stat(file, (err) => {
        resolve(err ? '' : file);
      });
    });
  }

  static cacheThis(f, mediaId, file) {
    return new Promise((resolve) => {
      file = `subs/${mediaId}_${file}.vtt`;
      fs.rename(f, file, (err) => {
        resolve(err ? f : file);
      });
    });
  }

  static getPath(videoFilePath, directory, file) {
    if (file[0] !== ':') {
      return `${directory}/${file}`;
    }
    return new Promise((resolve) => {
      let filename = file.substr(1);
      if (filename.endsWith('subrip')) {
        filename += '.srt';
      }
      const tmpFile = `${os.tmpdir()}/${filename}`;
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
        async () => {
          resolve(tmpFile);
        },
      );
    });
  }

  static convertedPath(file) {
    const extension = path.extname(file);
    if (extension === '.vtt') {
      return file;
    }
    if (converters[extension]) {
      return new Promise((resolve) => {
        const tmpFile = `${os.tmpdir()}/${Math.random()}.vtt`;
        const writeFile = fs.createWriteStream(tmpFile);
        writeFile.on(
          'close',
          () => {
            resolve(tmpFile);
          },
        );
        fs.createReadStream(file)
          .pipe(converters[extension]())
          .pipe(writeFile);
      });
    }
    return '';
  }
}

module.exports = Subtitles;
