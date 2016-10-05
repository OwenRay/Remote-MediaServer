"use strict";

var recursive = require('recursive-readdir');
var Settings = require("../Settings");
var Database = require("../Database");
var MediaItemHelper = require("../helpers/MediaItemHelper");
var fs = require("fs");

var TheMovieDBExtendedInfo = require("./extendedInfo/TheMovieDBExtendedInfo");
var FFProbeExtendedInfo = require("./extendedInfo/FFProbeExtendedInfo");
var ParseFileNameExtendedInfo = require("./extendedInfo/ParseFileNameExtendedInfo");
var TheMovieDBSeriesAndSeasons = require("./extendedInfo/TheMovieDBSeriesAndSeasons");

class MovieScanner
{

    constructor()
    {
        this.library = null;
        this.scanning = -1;
        this.scan();
        Settings.addObserver("libraries", this.scan.bind(this));
    }

    setScanTimeout()
    {
        if(this.scanTimeout) {
            clearTimeout(this.scanTimeout)
        }
        this.scanTimeout = setTimeout(this.scan.bind(this), Settings.getValue("scanInterval")*1000);
    }

    scan()
    {
        if(this.scanning!=-1)
        {
            console.log("Scan in progress");
            return;
        }
        console.log("start scanner");
        this.setScanTimeout();
        this.checkForMediaItemsWithMissingFiles();
        this.checkForMediaItemsWithMissingLibrary();
        this.scanNext();
    }

    checkForMediaItemsWithMissingFiles()
    {
        var items = Database.getAll("media-item");
        for(var c = 0; c<items.length; c++)
        {
            var item = items[c];
            fs.exists(MediaItemHelper.getFullFilePath(item), function(exists) {
                if (!exists) {
                    console.log("item missing, removing", item.id);
                    Database.deleteObject("media-item", item.id);
                }
            });
        }
    }

    checkForMediaItemsWithMissingLibrary()
    {
        var libraries = Settings.getValue("libraries");
        var libIds = [];
        for(var c = 0; c<libraries.length; c++)
        {
            libIds.push(libraries[c].uuid);
        }

        var items = Database.getAll("media-item");
        for(c = 0; c<items.length; c++)
        {
            if(libIds.indexOf(items[c].attributes.libraryId)==-1)
            {
                Database.deleteObject("media-item", items[c].id);
            }
        }
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
        console.log("start scan", this.library);
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
        //console.log("gotAllFiles", files);
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

        var extendedInfoItems = [
                                    new FFProbeExtendedInfo(),
                                    new ParseFileNameExtendedInfo(),
                                    new TheMovieDBSeriesAndSeasons(),
                                    new TheMovieDBExtendedInfo()
                                ];

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
