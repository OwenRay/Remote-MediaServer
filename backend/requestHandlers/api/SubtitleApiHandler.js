/**
 * Created by owenray on 31-3-2017.
 */
"use strict";
const RequestHandler = require("../RequestHandler");
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
const httpServer = require("../../HttpServer");

const supportedSubtitleFormats = [".srt", ".ass"];

class SubtitleApiHandler extends RequestHandler
{
    handleRequest()
    {
        console.log(this.context);
        var item = db.getById("media-item", this.context.params.id);
        if(!item) {
            return;
        }

        const filePath = this.filePath = item.attributes.filepath;
        const directory = path.dirname(filePath);

        if(this.context.params.file)
        {
            this.serveSubtitle(filePath, directory, this.context.params.file);
        }else{
            this.serveList(directory);
        }
        return new Promise(resolve=>{
           this.resolve = resolve;
        });
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

        return new FileRequestHandler(this.context)
            .serveFile(file, deleteAfterServe, this.resolve);
    }

    returnEmpty(){
        this.response.end("[]");
    }

    onReadDir(err, result) {
        if(err) {
            this.resolve();
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
                if(supportedSubtitleFormats.indexOf("."+streams[key].codec_name)!==-1) {
                    subtitles[":"+streams[key].index+"."+streams[key].codec_name] = "Built in: "+streams[key].tags.language;
                }
            }
            this.context.body = subtitles;
            this.resolve();
        }.bind(this));
    }
}

httpServer.registerRoute("get", "/api/subtitles/:id", SubtitleApiHandler);
httpServer.registerRoute("get", "/api/subtitles/:id/:file", SubtitleApiHandler);

module.exports = SubtitleApiHandler;