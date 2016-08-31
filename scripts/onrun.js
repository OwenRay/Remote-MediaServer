#!/usr/bin/env node
var fs = require("fs");
var os = require("os");
var http = require("http");
var unzip = require("unzip");

console.log("running on platform:", os.platform());
var addToExec = os.platform()=="win32"?".cmd":"";

var dir = process.env.HOME || process.env.USERPROFILE;
dir += "/.remote/"
if(!fs.existsSync(dir))
{
    fs.mkdirSync(dir);
}

//make sure all settings files are in the right directory
process.chdir(dir);

if(!fs.existsSync("cache"))
{
    fs.mkdirSync("cache");
}

if(!fs.existsSync(dir+"ffmpeg")&&!fs.existsSync(dir+"ffmpeg.exe")) {
    console.log("downloading ffmpeg");
    http.get("http://downloadffmpeg.s3-website-eu-west-1.amazonaws.com/ffmpeg_" + os.platform() + "_" + os.arch() + ".zip", function (response) {
        response.pipe(unzip.Extract({"path": "./"}));
    });
}

if(os.platform()=="win32")
{
    var Settings = require("../backend/Settings");
    var ffmpeg = Settings.getValue("ffmpeg_binary");
    var ffprobe = Settings.getValue("ffprobe_binary");
    if(!ffmpeg.match(/exe$/)) {
        Settings.setValue("ffmpeg_binary", ffmpeg + ".exe");
    }
    if(!ffprobe.match(/exe$/)) {
        Settings.setValue("ffprobe_binary", ffprobe + ".exe");
    }
    Settings.save();
}
