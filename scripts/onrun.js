#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const http = require('http');
const unzip = require('unzip2');

console.log('running on platform:', os.platform());
const addToExec = os.platform() === 'win32' ? '.cmd' : '';

let dir = process.env.HOME || process.env.USERPROFILE;
dir += '/.remote/';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// make sure all settings files are in the right directory
process.chdir(dir);

if (!fs.existsSync('cache')) {
  fs.mkdirSync('cache');
}
if (!fs.existsSync('subs')) {
  fs.mkdirSync('subs');
}
if (!fs.existsSync('store')) {
  fs.mkdirSync('store');
}
if (!fs.existsSync('share')) {
  fs.mkdirSync('share');
}

if (!fs.existsSync(`${dir}ffmpeg`) && !fs.existsSync(`${dir}ffmpeg.exe`)) {
  console.log('downloading ffmpeg');
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
  const Settings = require('../backend/core/Settings');
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
