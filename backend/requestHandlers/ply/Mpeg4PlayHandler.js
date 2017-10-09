/**
 * Created by owenray on 08-04-16.
 */
"use strict";
const FFMpeg = require("../../helpers/FFMpeg");
const Database = require("../../Database");
const httpServer = require("../../HttpServer");

const Log = require("../../helpers/Log");
const RequestHandler = require("../RequestHandler");

class Mpeg4PlayHandler extends RequestHandler{
    handleRequest(){
        const mediaItem = Database.getById("media-item", this.context.params.id);

        this.ffmpeg = new FFMpeg(mediaItem, "-")
            .setPlayOffset(this.context.params.offset)
            .setOnReadyListener(this.onFFMpegReady.bind(this))
            .addOutputArguments(
                [
                    "-f", "mp4",
                    "-movflags", "empty_moov"
                ]
            );
        if(this.context.query.audioChannel) {
            this.ffmpeg.setAudioChannel(this.context.query.audioChannel);
        }
        if(this.context.query.videoChannel) {
            this.ffmpeg.setVideoChannel(this.context.query.videoChannel);
        }
        this.ffmpeg.run();

        Log.debug("starting to play:"+this.file);

        return new Promise(resolve=>{
            this.resolve = resolve;
        });
    }

    onFFMpegReady() {
        this.context.req.connection.on('close',()=>{
            Log.debug("close video play connection!");
            this.ffmpeg.kill();
        });

        this.context.body = this.ffmpeg.getOutputStream();
        this.resolve();
    }
}

httpServer.registerRoute("get", "/ply/:id", Mpeg4PlayHandler, false, 0);
httpServer.registerRoute("get", "/ply/:id/:offset", Mpeg4PlayHandler, false, 0);

module.exports = Mpeg4PlayHandler;
