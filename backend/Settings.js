"use strict";

var fs = require("fs");
var Settings = {
    "port": 8080,
    "moviesFolder": process.env.HOME || process.env.USERPROFILE,
    "ffmpeg_binary": "ffmpeg",
    "ffprobe_binary": "ffprobe",
    "videoFileTypes": [
        "mkv",
        "mp4",
        "3gp",
        "avi",
        "mov",
        "ts",
        "webm",
        "flv",
        "f4v",
        "vob",
        "ogv",
        "ogg",
        "wmv",
        "qt",
        "rm",
        "mpg",
        "mpeg",
        "m4v"
    ]
};

try {
    var contents = fs.readFileSync("settings.json", "utf8");
    var newSettings = JSON.parse(contents);

    for (var key in newSettings) {
        Settings[key] = newSettings[key];
    }

} catch (e) {

}

fs.writeFileSync("settings.json", JSON.stringify(Settings, null, '\t'));

module.exports = Settings;
