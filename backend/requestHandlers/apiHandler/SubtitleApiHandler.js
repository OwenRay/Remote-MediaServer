/**
 * Created by owenray on 31-3-2017.
 */
"use strict";
const IApiHandler = require("./IApiHandler");
const fs = require("fs");
const db = require("../../Database");
const path = require('path');
const sub = require('srt-to-ass');
const os = require('os');
const FileRequestHandler = require("../FileRequestHandler");
const FFProbe = require("../../FFProbe");
const spawn = require('child_process').spawn;
const Settings = require("../../Settings");
const Log = require("../../helpers/Log");

const supportedSubtitleFormats = [".srt", ".ass"];

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
        const parts = url.pathname.split("/");
        if(parts.length<4) {
            return this.returnEmpty();
        }
        const filePath = this.filePath = db.getById("media-item", parts[3]).attributes.filepath;
        const directory = path.dirname(filePath);

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
        const extension = path.extname(file);
        let tmpFile;
        if(file[0]===":") {
            tmpFile = os.tmpdir()+"/"+file.substr(1);
            const args = [
                "-y",
                "-i", videoFilePath,
                "-map", "0" + file.split(".").shift(),
                tmpFile
            ];
            console.log("spawn!!!!!", Settings.getValue("ffmpeg_binary")+" "+args.join(" "));
            const proc = spawn(
                Settings.getValue("ffmpeg_binary"),
                args);
            proc.stdout.on('data', function(data)
            {
                Log.info("ffmpeg result:", `${data}`);
            });
            proc.stderr.on('data', function(data)
            {
                Log.info("ffmpeg result:", `${data}`);
            });
            proc.on(
                'close',
                function(){
                    this.serveSubtitle(videoFilePath, os.tmpdir(), file.substr(1), true);
                }.bind(this)
            );

            return;
        }

        if(extension===".srt") {
            tmpFile = os.tmpdir()+"/"+file+"."+Math.random()+".ass";
            sub.convert(
                directory+"/"+file,
                tmpFile,
                {},
                function(){
                    if(deleteAfterServe) {
                        fs.unlink(directory+":"+file);
                    }
                    this.serveSubtitle(videoFilePath, directory, tmpFile, true);
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
        const subtitles = {};
        for(let key in result) {
            if(supportedSubtitleFormats.indexOf(path.extname(result[key]))!==-1) {
                subtitles[result[key]] = result[key];
            }
        }
        FFProbe.getInfo(this.filePath).then(function(data){
            const streams = data.streams;
            for(let key in streams) {
                console.log(streams[key].codec_name);
                if(supportedSubtitleFormats.indexOf("."+streams[key].codec_name)!==-1) {
                    console.log(streams[key]);
                    subtitles[":"+streams[key].index+"."+streams[key].codec_name] = "Built in: "+streams[key].tags.language;
                }
            }
            this.response.end(JSON.stringify(subtitles));
        }.bind(this));
    }
}

module.exports = SubtitleApiHandler;