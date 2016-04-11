/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var spawn = require('child_process').spawn;
var Settings = require("../Settings");
var FFProbe = require("../FFProbe");

var RequestHandler = require("./RequestHandler");

class PlayRequestHandler extends RequestHandler{
    handleRequest()
    {
        console.log("test123");
        this.file = decodeURI(Settings.moviesFolder+this.request.url.substr(4));
        FFProbe.getInfo(this.file).then(this.gotInfo.bind(this), this.onError.bind(this));
    }

    gotInfo(info)
    {
        console.log(info);
        this.response.setHeader('Content-Type', "video/mp4");
        var vCodec = "libx264";
        var aCodec = "aac";

        var supportedVideoCodecs = {"h264":1};
        var supportedAudioCodecs = {"aac":1};


        for(var key in info.streams)
        {
            var stream = info.streams[key];
            if(stream.codec_type=="video"&&supportedVideoCodecs[stream.codec_name])
            {
                vCodec = "copy";
            }
            if(stream.codec_type=="audio"&&supportedAudioCodecs[stream.codec_name])
            {
                aCodec = "copy";
            }
            //if(stream.codec_name=="")
        }

        var args = [
            //"-r", "40",
            "-re",
            "-i", this.file,
            "-f", "mp4",
            "-vcodec", vCodec,
            "-movflags", "frag_keyframe+empty_moov",
            "-acodec", aCodec,
            "-strict", "-2",
            "-"
        ];
        var proc = spawn(
            Settings.ffmpeg_binary,
            args);

        proc.stdout.on('data', this.onData.bind(this));
        proc.stderr.on('data', this.onError.bind(this));
        proc.on('close', this.onClose.bind(this));
        this.request.connection.on('close',function(){
            console.log("close!");
            proc.kill("SIGINT");
        });
    }


    onData(data)
    {
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