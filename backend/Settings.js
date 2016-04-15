/**
 * Created by owenray on 08-04-16.
 */
"use strict"
var fs = require("fs");

var settingsObj = {
    "port": 8080,
    "name": "My Media Server",
    "moviesFolder": "/Users/owenray/",
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
    ],
};


var Settings = {
    observers:[],

    createIfNotExists()
    {
        if(!fs.existsSync("settings.json"))
        {
            Settings.save();
        }
    },

    getValue(key)
    {
        return settingsObj[key];
    },

    setValue(key, value)
    {
        var originalValue = settingsObj[key];
        settingsObj[key] = value;
        if(originalValue!=value)
        {
            this.triggerObservers(key);
        }
    },

    getAll()
    {
        return settingsObj;
    },

    load()
    {
        try {
            var contents = fs.readFileSync("settings.json", "utf8");
            var newSettings = JSON.parse(contents);
            for (var key in newSettings) {
                settingsObj[key] = newSettings[key];
            }
        }catch (e){
        }
    },

    save()
    {
        fs.writeFile("settings.json", JSON.stringify(settingsObj, null, '  '));
    },

    triggerObservers(variable)
    {
        console.log("trigger", variable);
        if(!Settings.observers[variable])
        {
            return;
        }
        console.log("trigger", variable);
        for(var c = 0; c<Settings.observers[variable].length; c++)
        {
            console.log("trigger", variable);
            Settings.observers[variable][c](variable);
        }
    },

    addObserver(variable, callback)
    {
        if(!Settings.observers[variable])
        {
            Settings.observers[variable] = [];
        }
        Settings.observers[variable].push(callback);
    }
};

Settings.load();
Settings.createIfNotExists();

module.exports = Settings;
