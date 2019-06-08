const fs = require('fs');
const os = require('os');
const http = require('http');
const unzip = require('node-unzip-2');
const Settings = require('../../core/Settings');


if (!fs.existsSync('ffmpeg') && !fs.existsSync('ffmpeg.exe')) {
  http.get(`http://downloadffmpeg.s3-website-eu-west-1.amazonaws.com/ffmpeg_${os.platform()}_${os.arch()}.zip`, (response) => {
    const e = unzip.Extract({ path: './' });
    response.pipe(e);
    e.on('close', () => {
      fs.chmodSync(`ffmpeg${os.platform() === 'win32' ? '.exe' : ''}`, '755');
      fs.chmodSync(`ffprobe${os.platform() === 'win32' ? '.exe' : ''}`, '755');
    });
  });
}

if (os.platform() === 'win32') {
  const ffmpeg = Settings.getValue('ffmpeg_binary');
  const ffprobe = Settings.getValue('ffprobe_binary');
  if (!ffmpeg.match(/exe$/)) {
    Settings.setValue('ffmpeg_binary', `${ffmpeg}.exe`);
  }
  if (!ffprobe.match(/exe$/)) {
    Settings.setValue('ffprobe_binary', `${ffprobe}.exe`);
  }
  Settings.save();
}


require('./FFProbeExtendedInfo');
require('./FFProbeImageHandler');
require('./HLSPlayHandler');
require('./MediaContentApiHandler');
require('./Mpeg4PlayHandler');
