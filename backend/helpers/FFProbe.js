/**
 * Created by Cole on 10-4-2016.
 */


const { spawn } = require('child_process');
const Settings = require('../Settings');
const Log = require('./Log');


const FFProbe =
  {
    /**
     * @type {{format:{bit_rate:Number, size:Number, duration:Number}}}
     */
    fileInfo: {},
    /**
     * @type {{pkt_pts_time:Number,pkt_duration_time:Number}}
     */
    frameData: {},

    getInfo(fileName) {
      return new Promise((resolve, reject) => {
        const proc = spawn(
          Settings.getValue('ffprobe_binary'),
          [
            '-v', 'quiet',
            '-show_format',
            '-show_streams',
            '-print_format', 'json',
            fileName,
          ],
        );
        let returnData = '';
        proc.stdout.on('data', (data) => {
          returnData += `${data}`;
        });
        proc.stderr.on('data', (data) => {
          reject(new Error(`${data}`));
          Log.info('ffprobe result:', `${data}`);
        });
        proc.on('close', () => {
          try {
            resolve(JSON.parse(returnData));
          } catch (e) {
            reject(e);
          }
        });
      });
    },

    getNearestKeyFrame(fileName, position) {
      return new Promise((resolve, reject) => {
        Log.debug(Settings.getValue('ffprobe_binary'), fileName);
        const proc = spawn(
          Settings.getValue('ffprobe_binary'),
          [
            '-v', 'quiet',
            '-read_intervals', `${position}%+#1`,
            '-show_frames',
            '-select_streams', 'v:0',
            '-print_format', 'json',
            fileName,
          ],
        );
        let returnData = '';
        proc.stdout.on('data', (data) => {
          returnData += `${data}`;
        });
        proc.stderr.on('data', (data) => {
          reject(new Error(`${data}`));
          Log.debug('got nearest key frame', `${data}`);
        });
        proc.on('close', () => {
          try {
            let data = JSON.parse(returnData);
            /**
             * @type {FFProbe.frameData}
             */
            [data] = data.frames;
            resolve(parseFloat(data.pkt_pts_time) - parseFloat(data.pkt_duration_time));
          } catch (e) {
            reject(e);
          }
        });
      });
    },
  };

module.exports = FFProbe;
