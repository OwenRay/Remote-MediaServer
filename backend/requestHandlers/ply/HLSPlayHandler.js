/**
 * Created by owenray on 08-04-16.
 */
"use strict";
const os = require('os');
const fs = require("fs");
const uuid = require('node-uuid');

const Log = require("../../helpers/Log");
const RequestHandler = require("../RequestHandler");
const FileRequestHandler = require("../FileRequestHandler");
const Database = require("../../Database");
const httpServer = require("../../HttpServer");
const FFMpeg = require("../../helpers/FFMpeg");

class HLSPlayHandler extends RequestHandler{
    handleRequest()
    {
        const params = this.context.params;
        const query = this.context.query;
        const mediaItem = Database.getById("media-item", params.id);

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
        //this.context.body = "redirecting";
        this.context.response.status = 302;
        this.response.set("Content-Type", "application/x-mpegURL");
        this.response.set("Location", redirectUrl);

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

        this.ffmpeg = new FFMpeg(mediaItem, this.m3u8)
            .setPlayOffset(params.offset)
            .addOutputArguments(
                [
                "-hls_time", 5,
                "-hls_list_size", 0,
                "-hls_base_url", this.request.url.split("?")[0] + "?format=hls&session=" + this.session + "&segment=",
                "-bsf:v", "h264_mp4toannexb"
                ]
            )
            .setOnClose(this.onClose.bind(this))
            .setOnReadyListener(this.onReady.bind(this))
            .run();
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
        this.onClose();

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

            if (!this.ffmpeg.paused) {
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
        context.response.set("Content-Type", "application/x-mpegURL");

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

    onReady() {
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
            if(files.length>limit&&!this.ffmpeg.paused) {
                this.ffmpeg.pause();
            }else if(files.length<=limit&&this.ffmpeg.paused) {
                this.ffmpeg.resume();
            }

        }.bind(this));
    }

    onClose()
    {
        clearInterval(this.checkPauseInterval);
        HLSPlayHandler.sessions[this.session] = null;
    }
}

HLSPlayHandler.sessions = [];

httpServer.registerRoute("get", "/ply/:id", HLSPlayHandler, false, 5);
httpServer.registerRoute("get", "/ply/:id/:offset", HLSPlayHandler, false, 5);

module.exports = HLSPlayHandler;
