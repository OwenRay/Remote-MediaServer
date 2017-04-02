/**
 * Created by owenray on 31-3-2017.
 */
"use strict"
var IApiHandler = require("./IApiHandler");
var querystring = require("querystring");
var fs = require("fs");
var db = require("../../Database");
var path = require('path');
var sub = require('srt-to-ass');
const os = require('os');
var FileRequestHandler = require("../FileRequestHandler");

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
        var filePath = db.getById("media-item", parts[3]).attributes.filepath;
        var directory = path.dirname(filePath);

        if(parts.length>=5)
        {
            this.serveSubtitle(directory, parts[4]);
        }else{
            this.serveList(directory);
        }

        return true;
    }

    serveList(directory){
        fs.readdir(directory, this.onReadDir.bind(this));
    }

    serveSubtitle(directory, file) {
        /*fs.readFile(directory+"/"+file, function(err, result){
            if(result&&path.extname(file)==".srt") {
                result = "WEBVTT\n\n"+result;
                result = result.replace(/(\d+:\d+:\d+),(\d+) (-->) (\d+:\d+:\d+),(\d+)+/g, "$1.$2 --> $4.$5");
            }
            this.response.end(result);
        }.bind(this));*/

        var deleteAfterServe = false;
        if(path.extname(file)==".srt") {
            var tmpFile = os.tmpdir()+"/"+file+"."+Math.random()+".ass";
            console.log(sub);
            sub.convert(
                directory+"/"+file, tmpFile
                //{"style": {"font": {"size": 100}}}
            );
            file = tmpFile;
            console.log(file);
            deleteAfterServe = true;
        }
        while(!fs.existsSync(file))
            ;

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
        var subtitles = [];
        for(var key in result) {
            if(supportedSubtitleFormats.indexOf(path.extname(result[key]))!=-1) {
                subtitles.push(result[key]);
            }
        }
        this.response.end(JSON.stringify(subtitles));
    }
}

module.exports = SubtitleApiHandler;