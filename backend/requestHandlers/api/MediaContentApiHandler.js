/**
 * Created by owenray on 31-3-2017.
 */
"use strict";
const RequestHandler = require("../RequestHandler");
const fs = require("fs");
const db = require("../../Database");
const path = require('path');
const ass2vtt = require('ass-to-vtt');
const srt2vtt = require('srt-to-vtt');
const os = require('os');
const FileRequestHandler = require("../FileRequestHandler");
const FFProbe = require("../../helpers/FFProbe");
const spawn = require('child_process').spawn;
const Settings = require("../../Settings");
const Log = require("../../helpers/Log");
const httpServer = require("../../HttpServer");

const supportedSubtitleFormats = [".srt", ".ass", ".subrip"];

class SubtitleApiHandler extends RequestHandler
{
    handleRequest()
    {
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
            var filename = file.substr(1);
            if(filename.endsWith("subrip")) {
                filename += ".srt";
            }
            tmpFile = os.tmpdir()+"/"+filename;
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
                    this.serveSubtitle(videoFilePath, os.tmpdir(), filename, true);
                }.bind(this)
            );

            return;
        }
        console.log(file);
        if(extension===".srt"||extension===".subrip") {
            let filename = file+"."+Math.random()+".vtt";
            tmpFile = os.tmpdir()+"/"+filename;
            let writeFile = fs.createWriteStream(tmpFile);
            writeFile.on('close',
                function(){
                    if(deleteAfterServe) {
                        fs.unlink(directory+":"+file, ()=>{});
                    }
                    this.serveSubtitle(videoFilePath, os.tmpdir(), filename, true)
                }.bind(this));
            fs.createReadStream(directory + "/" + file)
                .pipe(srt2vtt())
                .pipe(writeFile);
            return;
        } else if (extension===".ass") {
            let filename = file+"."+Math.random()+".vtt";
            tmpFile = os.tmpdir()+"/"+filename;
            let writeFile = fs.createWriteStream(tmpFile);
            writeFile.on('close',
                function(){
                    if(deleteAfterServe) {
                        fs.unlink(directory+":"+file, ()=>{});
                    }
                    this.serveSubtitle(videoFilePath, os.tmpdir(), filename, true)
                }.bind(this));
            fs.createReadStream(directory + "/" + file)
                .pipe(ass2vtt())
                .pipe(writeFile);
            return;
        } else{
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
        const response = {subtitles:[]};
        for(let key in result) {
            if(supportedSubtitleFormats.indexOf(path.extname(result[key]))!==-1) {
                response.subtitles.push({
                    label:result[key],
                    value:result[key],
                });
            }
        }

        FFProbe.getInfo(this.filePath).then(function(data){
            const streams = data.streams;
            for(let key in streams) {
                var str = streams[key];
                var name = str.tags?
                            (str.tags.title?str.tags.title:str.tags.language):
                            str.codec_long_name;
                name = name?name:str.codec_name;
                if(supportedSubtitleFormats.indexOf("."+str.codec_name)!==-1) {
                    response.subtitles.push({
                        "label": "Built in: " + name,
                        "value": ":"+str.index + "." + str.codec_name
                    });
                }else{
                    if(!response[str.codec_type]) {
                        response[str.codec_type] = [];
                    }
                    response[str.codec_type].push({
                            "label":name,
                            "value":str.index,
                        });
                }
            }
            this.context.body = response;
            this.resolve();
        }.bind(this));
    }
}

httpServer.registerRoute("get", "/api/mediacontent/:id", SubtitleApiHandler);
httpServer.registerRoute("get", "/api/mediacontent/subtitle/:id/:file", SubtitleApiHandler);

module.exports = SubtitleApiHandler;
