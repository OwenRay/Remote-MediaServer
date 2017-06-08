/**
 * Created by owenray on 08-04-16.
 */
"use strict";
const spawn = require('child_process').spawn;
const os = require('os');
const fs = require("fs");
const Settings = require("../../Settings");
const FFProbe = require("../../FFProbe");
const Database = require("../../Database");
const httpServer = require("../../HttpServer");

const MediaItemHelper = require("../../helpers/MediaItemHelper");
const Log = require("../../helpers/Log");
const RequestHandler = require("../RequestHandler");

class Mpeg4PlayHandler extends RequestHandler{
    handleRequest(){
        this.offset = this.context.params.offset;
        this.mediaItem = Database.getById("media-item", this.context.params.id);
        this.file = MediaItemHelper.getFullFilePath(this.mediaItem);

        Log.debug("starting to play:"+this.file);
        this.bufferedChuncks = 0;
        FFProbe.getInfo(this.file)
            .then(this.gotInfo.bind(this), this.onError.bind(this));
        return new Promise(resolve=>{
           this.resolve = resolve;
        });
    }

    gotInfo(info)
    {
        if(!info||!info.format)
        {
            Log.warning("VIDEO ERROR!");
            return this.resolve();
        }
        this.response.headers['Content-Type'] = "video/mp4";
        this.response.headers['Accept-Ranges'] = 'none';

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
        const args = [
            //"-re", // <-- should read the file at running speed... but a little to slow...
            "-probesize", "50000000",
            "-thread_queue_size", "1024",
            "-i", this.file,
            "-i", this.tmpFile,
            "-map_metadata", "1",

            "-f", "mp4",
            "-vcodec", vCodec,
            "-movflags", "empty_moov",
            "-acodec", aCodec,
            "-strict", "-2",
            "-"
        ];
        if(aCodec!=="copy")
        {
            Log.debug("mixing down to 2 AC!");
            args.splice(18, 0, "-ac", 2, "-ab", "192k");
        }
        if(this.offset!==undefined&&this.offset!==0) {
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
        this.context.res.on("drain", this.onDrain.bind(this));

        this.context.req.connection.on('close',function(){
            Log.debug("close video play connection!");
            proc.kill("SIGINT");
        });
        this.context.body = proc.stdout;
        this.resolve();
    }


    onData(data) {
        this.bufferedChuncks++;
        if(this.bufferedChuncks>20)
        {
            this.proc.stdout.pause();
        }

        /*this.response.write(data, function () {
            this.bufferedChuncks--;
            this.proc.stdout.resume();
        }.bind(this));*/
    }

    onDrain() {
        this.bufferedChuncks = 0;
        this.proc.stdout.resume();
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

httpServer.registerRoute("get", "/ply/:id", Mpeg4PlayHandler, false, 0);
httpServer.registerRoute("get", "/ply/:id/:offset", Mpeg4PlayHandler, false, 0);

module.exports = Mpeg4PlayHandler;
