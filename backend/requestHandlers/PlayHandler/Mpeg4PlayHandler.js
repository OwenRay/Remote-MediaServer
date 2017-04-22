/**
 * Created by owenray on 08-04-16.
 */
"use strict";
const spawn = require('child_process').spawn;
const os = require('os');
const fs = require("fs");
const Settings = require("../../Settings");
const FFProbe = require("../../FFProbe");

const MediaItemHelper = require("../../helpers/MediaItemHelper");
const Log = require("../../helpers/Log");
const IPlayHandler = require("./IPlayHandler");

class Mpeg4PlayHandler extends IPlayHandler{
    play(mediaItem, offset, request, response)
    {
        this.offset = offset;
        this.response = response;
        this.request = request;
        this.file = MediaItemHelper.getFullFilePath(mediaItem);
        Log.debug("starting to play:"+this.file);
        this.bufferedChuncks = 0;
        FFProbe.getInfo(this.file).then(this.gotInfo.bind(this), this.onError.bind(this));
    }

    gotInfo(info)
    {
        /*if(!correctedOffset&&this.offset!=0)
        {
            FFProbe.getNearestKeyFrame(this.file, this.offset)
                .then(
                    function(offset){
                        //this.offset = offset;
                        this.offset = offset;
                        Log.debug("play from 2:", offset);
                        this.gotInfo(info, true);
                    }.bind(this),
                    this.onError.bind(this)
                );
            return;
        }*/
        if(!info||!info.format)
        {
            Log.warning("VIDEO ERROR!");
            this.response.end();
            return;
        }
        this.response.setHeader('Content-Type', "video/mp4");
        this.response.setHeader('Accept-Ranges', 'none');

        let vCodec = "libx264";
        let aCodec = "aac";

        const supportedVideoCodecs = {"h264": 1};
        const supportedAudioCodecs = {"aac": 1};


        for(let key in info.streams)
        {
            const stream = info.streams[key];
            if(stream.codec_type==="video"&&supportedVideoCodecs[stream.codec_name])
            {
                vCodec = "copy";
            }
            if(stream.codec_type==="audio"&&supportedAudioCodecs[stream.codec_name])
            {
                aCodec = "copy";
            }
        }
        const duration = Math.round((info.format.duration - this.offset) * 1000);
        Log.debug("setDuration", duration);
        //OK... this is a hack to specify the video duration...
        this.tmpFile = os.tmpdir()+"/"+Math.random()+".txt";
        const metadata = ";FFMETADATA1\n" +
            "[CHAPTER]\n" +
            "TIMEBASE=1/1000\n" +
            //"START=0\n"+
            "END=" + duration + "\n" +
            "title=chapter \#1\n";

        fs.writeFileSync(this.tmpFile, metadata);

        // om keyframe te vinden, gaat wellicht veel fixen:
        // ffprobe.exe -read_intervals 142%+#1  -show_frames -select_streams v:0 -print_format json  "//home/nzbget/downloads/complete/MoviesComplete\Hitman Agent 47 2015 BluRay 720p DTS-ES x264-ETRG\Hitman Agent 47 2015 BluRay 720p DTS x264-ETRG.mkv" | grep pts_time
        const args = [
            //"-re", // <-- should read the file at running speed... but a little to slow...
            "-probesize", "50000000",
            "-thread_queue_size", "1024",
            //"-ss", this.offset,
            "-i", this.file,
            "-i", this.tmpFile,
            //"-ss", 0,
            "-map_metadata", "1",
            //"-af", "aresample=60000",
            //"-keyint_min", "60", "-g", "60",
            //"-r", "25",

            "-f", "mp4",
            "-vcodec", vCodec,
            "-movflags", "empty_moov",
            "-acodec", aCodec,
            //"-metadata:c:0", 'end=120000',
            "-strict", "-2",
            "-"
        ];
        if(aCodec!=="copy")
        {
            Log.debug("mixing down to 2 AC!");
            args.splice(18, 0, "-ac", 2, "-ab", "192k");
        }
        if(this.offset!==0) {
            args.splice(8, 0, "-ss", 0);
            args.splice(4, 0, "-ss", this.offset);
        }
        Log.info("starting ffmpeg:"+Settings.getValue("ffmpeg_binary")+" "+args.join(" "));
        const proc = spawn(
            Settings.getValue("ffmpeg_binary"),
            args);
        this.proc = proc;

        proc.stdout.on('data', this.onData.bind(this));
        proc.stderr.on('data', this.onError.bind(this));
        proc.on('close', this.onClose.bind(this));
        proc.on('drain', function(){
            proc.stdout.resume();
        });
        this.request.connection.on('close',function(){
            Log.debug("close video play connection!");
            proc.kill("SIGINT");
        });
    }


    onData(data) {
        this.bufferedChuncks++;
        if(this.bufferedChuncks>20)
        {
            this.proc.stdout.pause();
        }

        this.response.write(data, function () {
            this.bufferedChuncks--;
            this.proc.stdout.resume();
        }.bind(this));
    }

    onError(data)
    {
        Log.warning("ffmpeg error:"+`${data}`);
    }

    onClose(code)
    {
        Log.debug("Close:"+code, this.tmpFile);
        fs.unlink(this.tmpFile);
    }
}

module.exports = Mpeg4PlayHandler;
