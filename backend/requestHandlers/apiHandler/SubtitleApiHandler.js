/**
 * Created by owenray on 31-3-2017.
 */
"use strict";
var IApiHandler = require("./IApiHandler");
var fs = require("fs");
var db = require("../../Database");
var path = require('path');
var sub = require('srt-to-ass');
const os = require('os');
var FileRequestHandler = require("../FileRequestHandler");
var FFProbe = require("../../FFProbe");
var spawn = require('child_process').spawn;
var Settings = require("../../Settings");
var Debug = require("../../helpers/Debug");

var supportedSubtitleFormats = [".srt", ".ass"];

class SubtitleApiHandler extends IApiHandler
{
    handle(request, response, url)
    {
        if(!url.pathname.startsWith("/api/subtitles/"))
        {
            return false;
        }

        this.request = request;
        this.response = response;
        var parts = url.pathname.split("/");
        if(parts.length<4) {
            return this.returnEmpty();
        }
        var filePath = this.filePath = db.getById("media-item", parts[3]).attributes.filepath;
        var directory = path.dirname(filePath);

        if(parts.length>=5)
        {
            this.serveSubtitle(filePath, directory, decodeURI(parts[4]));
        }else{
            this.serveList(directory);
        }

        return true;
    }

    serveList(directory){
        fs.readdir(directory, this.onReadDir.bind(this));
    }

    serveSubtitle(videoFilePath, directory, file, deleteAfterServe) {
        console.log("serveSubtitle", arguments);
        var extension = path.extname(file);

        if(file[0]==":") {
            var tmpFile = os.tmpdir()+"/"+file.substr(1);
            var args = [
                "-y",
                "-i", videoFilePath,
                "-map", "0"+file.split(".").shift(),
                tmpFile
            ];
            console.log("spawn!!!!!", Settings.getValue("ffmpeg_binary")+" "+args.join(" "));
            var proc = spawn(
                Settings.getValue("ffmpeg_binary"),
                args);
            proc.stdout.on('data', function(data)
            {
                Debug.info("ffmpeg result:", `${data}`);
            });
            proc.stderr.on('data', function(data)
            {
                Debug.info("ffmpeg result:", `${data}`);
            });
            proc.on(
                'close',
                function(){
                    this.serveSubtitle(videoFilePath, os.tmpdir(), file.substr(1), true);
                }.bind(this)
            );

            return;
        }

        if(extension==".srt") {
            var tmpFile = os.tmpdir()+"/"+file+"."+Math.random()+".ass";
            sub.convert(
                directory+"/"+file,
                tmpFile,
                {},
                function(err){
                    if(deleteAfterServe) {
                        fs.unlink(directory+":"+file);
                    }
                    this.serveSubtitle(directory, tmpFile, true);
                }.bind(this)
            );
            return;
        }else{
            file = directory+"/"+file;
        }

        return new FileRequestHandler(this.request, this.response)
            .serveFile(file, deleteAfterServe);
    }

    returnEmpty(){
        this.response.end("[]");
    }

    onReadDir(err, result) {
        if(err) {
            return this.returnEmpty();
        }
        var subtitles = {};
        for(var key in result) {
            if(supportedSubtitleFormats.indexOf(path.extname(result[key]))!=-1) {
                subtitles.push(result[key]);
                subtitles[result[key]] = result[key];
            }
        }
        FFProbe.getInfo(this.filePath).then(function(data){
            var streams = data.streams;
            for(var key in streams) {
                console.log(streams[key].codec_name);
                if(supportedSubtitleFormats.indexOf("."+streams[key].codec_name)!=-1) {
                    console.log(streams[key]);
                    subtitles[":"+streams[key].index+"."+streams[key].codec_name] = "Built in: "+streams[key].tags.language;
                }
            }
            this.response.end(JSON.stringify(subtitles));
        }.bind(this));
    }
}

module.exports = SubtitleApiHandler;