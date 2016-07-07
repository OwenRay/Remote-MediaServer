"use strict";

var recursive = require('recursive-readdir');
var Settings = require("../Settings");
var Database = require("../Database");
var TheMovieDBExtendedInfo = require("./extendedInfo/TheMovieDBExtendedInfo");
var FFProbeExtendedInfo = require("./extendedInfo/FFProbeExtendedInfo");
var ParseFileNameExtendedInfo = require("./extendedInfo/ParseFileNameExtendedInfo");


class MovieScanner
{

    constructor()
    {
        this.scanning = -1;
        this.library = null;
        Settings.addObserver("libraries", this.scan.bind(this));
    }

    scan()
    {
        if(this.scanning!=-1)
        {
            return;
        }
        this.scanNext();
    }

    scanNext()
    {
        this.scanning++;
        if(this.scanning>=Settings.getValue("libraries").length)
        {
            this.scanning = -1;
            return;
        }

        this.types = Settings.getValue("videoFileTypes");
        this.library = Settings.getValue("libraries")[this.scanning];
        //console.log("start scan", this.library);
        recursive(this.library.folder, [this.willInclude.bind(this)], this.onListed.bind(this));
    }

    willInclude(file, fileRef)
    {
        if(fileRef.isDirectory())
            return false;
        var f = file.split(".");
        var type =  f[f.length-1];
        for(var c = 0; c<this.types.length; c++) {
            if (this.types[c] === type) {
                return false;
            }
        }
        return true;
    }

    onListed(err, files)
    {
        if(err)
        {
            // console.log(err);
            return;
        }
        // console.log("gotAllFiles");
        for(var offset = 0; offset<files.length; offset++)
        {
            var file = files[offset].substr(this.library.folder.length);
            if(!Database.findBy("media-item", "filepath", file).length) {
                Database.setObject(
                    "media-item",
                    {
                        filepath: file,
                        libraryId: this.library.uuid,
                        mediaType: this.library.type
                    });
            }
        }
        this.checkForExtendedInfo();
    }

    checkForExtendedInfo()
    {
        // console.log("checking for extended info...");
        var items = Database.findBy("media-item", "libraryId", this.library.uuid);

        var extendedInfoItems = [new ParseFileNameExtendedInfo(), new TheMovieDBExtendedInfo(), new FFProbeExtendedInfo()];

        var loadNext = function()
        {
            // console.log("extendInfo, next");
            if(items.length === 0) {
                console.log("done scanning");
                this.scanNext();
                return;
            }

            var item = items.pop();

            var prevPromise;
            for(var c = 0; c<extendedInfoItems.length; c++)
            {
                if(!prevPromise)
                {
                    prevPromise = extendedInfoItems[c].extendInfo([item, this.library]);
                }else{
                    prevPromise = prevPromise.then(extendedInfoItems[c].extendInfo.bind(extendedInfoItems[c]));
                }
            }
            prevPromise.then(loadNext);

        }.bind(this);
        loadNext();
    }
}

//MovieScanner is a singleton!
module.exports = new MovieScanner();
