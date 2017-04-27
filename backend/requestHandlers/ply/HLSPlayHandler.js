/**
 * Created by owenray on 08-04-16.
 */
"use strict";
const spawn = require('child_process').spawn;
const os = require('os');
const fs = require("fs");
const url = require("url");
const Settings = require("../../Settings");
const FFProbe = require("../../FFProbe");
const uuid = require('node-uuid');

const MediaItemHelper = require("../../helpers/MediaItemHelper");
const Log = require("../../helpers/Log");
const RequestHandler = require("../RequestHandler");
const FileRequestHandler = require("../FileRequestHandler");
const Database = require("../../Database");
const httpServer = require("../../HttpServer");

class HLSPlayHandler extends RequestHandler{
    handleRequest()
    {
        const params = this.context.params;
        const query = this.context.query;
        const mediaItem = Database.getById("media-item", params.id);
        this.offset = params.offset;

        if(query.format!=="hls"&&
            (this.request.headers["user-agent"].indexOf("Chrome")!==-1||
            this.request.headers["user-agent"].indexOf("Safari")===-1)) {
            return;
        }
        if(this.request.headers["x-playback-session-id"]&&!query.session) {
            this.context.query.session = this.request.headers["x-playback-session-id"];
        }

        if(query.session&&HLSPlayHandler.sessions[query.session]) {
            return HLSPlayHandler.sessions[query.session]
                        .newRequest(this.context, query.segment);
        }

        Log.debug("STARTING NEW HLS SESSION!!!");
        const id = query.session ? query.session : uuid.v4();
        this.session = id;
        const redirectUrl = "/ply/" + mediaItem.id + "/0?format=hls&session=" + id;
        Log.debug("started hls session", redirectUrl);

        HLSPlayHandler.sessions[id] = this;
        this.setSessionTimeout();
        this.response.headers["Content-Type"] = "application/x-mpegURL"
        this.context.body = "#EXTM3U\n"+
            "#EXT-X-STREAM-INF:PROGRAM-ID=1, BANDWIDTH=200000, RESOLUTION=720x480\n"+
            redirectUrl;

        //prepare for decoding
        let dir = os.tmpdir() + "/remote_cache";
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        dir+="/"+this.session+"/";
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        this.m3u8 = dir+"vid.m3u8";
        this.file = MediaItemHelper.getFullFilePath(mediaItem);

        Log.debug("starting to play:"+this.file);
        //get file info and start encoding
        FFProbe.getInfo(this.file).then(this.gotInfo.bind(this), this.onError.bind(this));
        return true;
    }

    /**
     * timeout sessions and cleanup disk when sessions are no longer in use
     */
    setSessionTimeout() {
        if(this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
        //session will time out after 2 minutes of no activity
        this.sessionTimeout = setTimeout(this.timedOut.bind(this), 120000);
    }

    timedOut() {
        if(this.proc) {
            this.proc.kill();
        }
        Log.debug("session timeout!");
        this.onClose(0);

        //clean up filesystem
        const parts = this.m3u8.split("/");
        parts.pop();
        const folder = parts.join("/");
        fs.readdir(folder, (err, files) => {
            const deleteNext = function () {
                if (files.length === 0) {
                    return fs.rmdir(folder, function () {});
                }
                fs.unlink(files.pop(), deleteNext);
            };
            deleteNext();
        });
    }

    newRequest(context, segment) {
        this.setSessionTimeout();
        return new Promise(resolve=> {
            if (segment) { //serve ts file
                context.response['Accept-Ranges'] = 'none';
                const file = os.tmpdir() + "/remote_cache/" + this.session + "/" + segment;
                Log.debug("return hls");
                if (!this.playStart) { //set the play start time when serving first ts file
                    this.playStart = new Date().getTime();
                }
                return new FileRequestHandler(context)
                    .serveFile(file, true, resolve);
            }

            if (!this.paused) {
                setTimeout(function () {
                    this.newRequest(context, segment).then(resolve);
                }.bind(this), 1000);
                return;
            }
            this.serveFirstHls(context, resolve);
        });
    }

    /**
     * @param response
     *
     * Make sure the first hls that's requested has no more then three chunks
     * this is to ensure the browser will not skip any chunks
     */
    serveFirstHls(context, resolve) {
        context.response.headers["Content-Type"] = "application/x-mpegURL";

        fs.readFile(this.m3u8, (err, data) => {
            if (err) {
                return resolve();
            }
            context.body = "";
            const currentTime = this.playStart ? (new Date().getTime() - this.playStart) / 1000 : 0;
            let segmentTime = 0;

            const lines = `${data}`.split("\n");
            let newSegments = 0;
            for (let c = 0; c < lines.length; c++) {
                context.body+=lines[c] + "\n";
                if (lines[c][0] !== "#" && segmentTime >= currentTime) {
                    newSegments++;
                } else {
                    const ext = lines[c].substring(1).split(":");
                    if (ext[0] === "EXTINF") {
                        segmentTime += parseFloat(ext[1]);
                    }
                }
                if (newSegments === (!this.playStart ? 3 : 5)) {
                    break;
                }
            }

            resolve();
        });
    }

    /**
     *
     * @param {FFProbe.fileInfo} info
     */
    gotInfo(info)
    {
        if(this.ended) {
            return;
        }
        if(!info||!info.format)
        {
            Log.warning("VIDEO ERROR!:", info);
            this.response.end();
            return;
        }

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

        // om keyframe te vinden, gaat wellicht veel fixen:
        // ffprobe.exe -read_intervals 142%+#1  -show_frames -select_streams v:0 -print_format json  "//home/nzbget/downloads/complete/MoviesComplete\Hitman Agent 47 2015 BluRay 720p DTS-ES x264-ETRG\Hitman Agent 47 2015 BluRay 720p DTS x264-ETRG.mkv" | grep pts_time
        const args = [
            //"-re", // <-- should read the file at running speed... but a little to slow...
            "-probesize", "50000000",
            "-thread_queue_size", "1024",
            "-i", this.file,

            "-stdin",
            "-vcodec", vCodec,
            "-hls_time", 5,
            "-hls_list_size", 0,
            "-hls_base_url", this.request.url.split("?")[0] +
            "?format=hls&session=" + this.session + "&segment=",
            "-bsf:v", "h264_mp4toannexb",
            "-acodec", aCodec,
            "-sn",
            "-strict", "-2",
            this.m3u8

        ];
        if(aCodec!=="copy")
        {
            Log.debug("mixing down to 2 AC!");
            args.splice(19, 0, "-ac", 2, "-ab", "192k");
        }
        if(this.offset!==0) {
            args.splice(6, 0, "-ss", 0);
            args.splice(4, 0, "-ss", this.offset);
        }
        Log.info("starting ffmpeg:"+Settings.getValue("ffmpeg_binary")+" "+args.join(" "));
        const proc = spawn(
            Settings.getValue("ffmpeg_binary"),
            args,
            {
                "stdio": ["pipe", null, "pipe", this.str]
            });
        this.proc = proc;
        proc.on("error", this.onError.bind(this));

        proc.stdout.on('data', this.onInfo.bind(this));
        proc.stderr.on('data', this.onError.bind(this));
        proc.on('close', this.onClose.bind(this));
        this.checkPause();
        this.checkPauseInterval = setInterval(this.checkPause.bind(this), 100);
    }

    /**
     * pauses the video encoding process when there are enough chunks available
     */
    checkPause() {
        fs.readdir(os.tmpdir() + "/remote_cache/" + this.session + "/", function(err, files){
            if(err) {
                return;
            }
            const limit = 10;
            if(files.length>limit&&!this.paused) {
                this.paused = true;
                this.proc.stdin.write("c");
            }else if(files.length<=limit&&this.paused) {
                this.paused = false;
                this.proc.stdin.write("\n");
            }

        }.bind(this));
    }

    onInfo(data)
    {
        Log.debug("ffmpeg:"+`${data}`);
    }

    onError(data)
    {
        Log.debug("ffmpeg:"+`${data}`);
    }

    onClose()
    {
        clearInterval(this.checkPauseInterval);
        HLSPlayHandler.sessions[this.session] = null;
        this.ended = true;
    }
}

HLSPlayHandler.sessions = [];

httpServer.registerRoute("get", "/ply/:id", HLSPlayHandler, false, 5);
httpServer.registerRoute("get", "/ply/:id/:offset", HLSPlayHandler, false, 5);

module.exports = HLSPlayHandler;
