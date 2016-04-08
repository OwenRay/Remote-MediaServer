/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var spawn = require('child_process').spawn;
var Settings = require("../Settings");

var RequestHandler = require("./RequestHandler");

class PlayRequestHandler extends RequestHandler{
    handleRequest()
    {
        var file = Settings.moviesFolder+this.request.url.substr(4);

        this.response.setHeader('Content-Type', "video/mp4");

        var args = [
                        "-i", file,
                        "-f", "mp4",
                        "-vcodec", "libx264",
                        "-movflags", "frag_keyframe+empty_moov",
                        "-acodec", "aac",
                        "-strict", "-2",
                        "-"
                    ];
        var proc = spawn(
            "ffmpeg",
            args);

        proc.stdout.on('data', this.onData.bind(this));
        proc.stderr.on('data', this.onError.bind(this));
        proc.on('close', this.onClose.bind(this));

    }

    onData(data)
    {
        //console.log(`${data}`);
        this.response.write(data);
    }

    onError(data)
    {
        console.log(`${data}`);
    }

    onClose(code)
    {
        console.log("Close:"+code);
        this.response.end();
    }
}

module.exports = PlayRequestHandler;