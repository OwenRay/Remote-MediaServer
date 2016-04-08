/**
 * Created by owenray on 08-04-16.
 */
"use strict"

var contents = require("fs").readFileSync("settings.json", "utf8");
var Settings = {
                "port": 8080,
                "moviesFolder": "/Users/owenray/",

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


Settings = JSON.parse(contents);
module.exports = Settings;