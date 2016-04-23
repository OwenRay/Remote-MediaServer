#!/usr/bin/env node
var fs = require("fs");
var Settings = require("../backend/Settings");
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

if(!fs.existsSync(dir+"ffmpeg")&&!fs.existsSync(dir+"ffmpeg.exe")) {
    console.log("downloading ffmpeg");
    http.get("http://downloadffmpeg.s3-website-eu-west-1.amazonaws.com/ffmpeg_" + os.platform() + "_" + os.arch() + ".zip", function (response) {
        response.pipe(unzip.Extract({"path": "./"}));
    });
}

if(os.platform()=="win32")
{
  Settings.setValue("ffmpeg_binary", "ffmpeg.exe");
  Settings.setValue("ffprobe_binary", "ffprobe.exe");
  Settings.save();
}
