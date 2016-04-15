/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var spawn = require('child_process').spawn;
var os = require('os');
var fs = require("fs");
var Settings = require("../Settings");
var FFProbe = require("../FFProbe");

var RequestHandler = require("./RequestHandler");

class PlayRequestHandler extends RequestHandler{
    handleRequest()
    {
        //this.file = decodeURI(Settings.moviesFolder+this.request.url.substr(4));
        var parts = this.request.url.split("/");
        parts.shift();
        parts.shift();
        this.offset = parts.pop();
        this.file = Settings.moviesFolder+"/"+decodeURI(parts.join("/"));
        console.log(this.file);
        FFProbe.getInfo(this.file).then(this.gotInfo.bind(this), this.onError.bind(this));
    }

    gotInfo(info)
    {
        if(!info||!info.format)
        {
            console.log("VIDEO ERROR!");
            this.response.end();
            return;
        }
        this.response.setHeader('Content-Type', "video/mp4");
        this.response.setHeader('Accept-Ranges', 'bytes');
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
        }
        //console.log()
        var duration = Math.round((info.format.duration-this.offset)*1000);
        console.log("setDuration", duration);
        //OK... this is a hack to specify the video duration...
        this.tmpFile = os.tmpdir()+Math.random()+".txt";
        var metadata = ";FFMETADATA1\n"+
                        "[CHAPTER]\n"+
                        "TIMEBASE=1/1000\n"+
                        //"START=0\n"+
                        "END="+duration+"\n"+
                        "title=chapter \#1\n";

        fs.writeFileSync(this.tmpFile, metadata);

        var args = [
            //"-re", // <-- should read the file at running speed... but a little to slow...
            "-ss", this.offset,
            "-i", this.file,
            "-i", this.tmpFile,
            "-map_metadata", "1",

            "-f", "mp4",
            "-vcodec", vCodec,
            "-movflags", "faststart+empty_moov",
            "-acodec", aCodec,
            "-metadata:c:0", 'end=120000',
            "-strict", "-2",
            "-"
        ];

        console.log(Settings.ffmpeg_binary+" "+args.join(" "));
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
